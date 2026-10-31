import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { InventoryService, Product, Khata, DashboardSummary, FestivalConfig } from './services/inventory.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  products: Product[] = [];
  khataLedger: Khata[] = [];
  isLoggedIn = false;
  activeTab: 'overview' | 'inventory' | 'khata' | 'analysis' = 'overview';
  userRole: 'ADMIN' | 'WORKER' = 'ADMIN';
  private readonly inactivityMs = 10 * 60 * 1000;
  private inactivityTimer: any;
  festivalConfigs: FestivalConfig[] = [];
  loginForm = {
    phoneNumber: '',
    password: '',
    role: 'ADMIN' as 'ADMIN' | 'WORKER'
  };
  dashboardSummary: DashboardSummary = {
    totalProducts: 0,
    lowStockCount: 0,
    inventoryValue: 0,
    totalKhataOutstanding: 0,
    totalKhataEntries: 0
  };

  festivalAlert = {
    festival: 'Diwali Campaign',
    daysLeft: 15,
    message: 'Recommended stock: premium sweets, dry fruits, diyas, gifting packs.'
  };

  comboForm = {
    selectedProductId: '',
    bundlePrice: 0,
    quantity: 1
  };

  comboResult = {
    totalCost: 0,
    profit: 0,
    markupPercent: 0,
    marginPercent: 0
  };

  productForm = {
    name: '',
    brand: '',
    category: 'General',
    currentStock: 0,
    minStockAlert: 0,
    purchasePrice: 0,
    mrp: 0
  };

  khataForm = {
    customerName: '',
    phoneNumber: '',
    outstandingBalance: 0
  };

  constructor(private inventoryService: InventoryService) {}

  ngOnInit(): void {
    const savedRole = localStorage.getItem('kirana-user-role');
    if (savedRole === 'ADMIN' || savedRole === 'WORKER') {
      this.userRole = savedRole;
      this.isLoggedIn = true;
    }

    this.attachInactivityWatcher();
    this.loadProducts();
    this.loadKhata();
    this.loadDashboardSummary();
    if (this.isLoggedIn) {
      this.loadFestivalAlerts();
    }
    this.setRole(this.userRole);
  }

  isAdmin(): boolean {
    return this.userRole === 'ADMIN';
  }

  canManageInventory(): boolean {
    return this.isAdmin();
  }

  canAccessAnalysis(): boolean {
    return this.isAdmin();
  }

  private requireAdminAction(actionName: string): boolean {
    if (!this.isAdmin()) {
      alert(`Only admins can ${actionName}.`);
      return false;
    }
    return true;
  }

  setRole(role: 'ADMIN' | 'WORKER'): void {
    this.userRole = role;
    this.loginForm.role = role;
  }

  onLogin(): void {
    const phone = this.loginForm.phoneNumber.trim();
    const password = this.loginForm.password.trim();

    if (!phone || !password) {
      alert('Phone number and password are required.');
      return;
    }

    this.inventoryService.loginUser({
      phoneNumber: phone,
      password: password
    }).subscribe({
      next: (response) => {
        const normalizedRole = (response.role || this.loginForm.role)
          .toString()
          .toUpperCase()
          .replace('ROLE_', '') as 'ADMIN' | 'WORKER';

        if (normalizedRole !== 'ADMIN' && normalizedRole !== 'WORKER') {
          alert('Invalid user role returned by the server.');
          return;
        }

        this.userRole = normalizedRole;
        this.loginForm.role = normalizedRole;
        this.isLoggedIn = true;
        localStorage.setItem('kirana-user-role', normalizedRole);
        localStorage.setItem('kirana-user-phone', response.phoneNumber || phone);
        if (response.token) {
          localStorage.setItem('kirana-auth-token', response.token);
        }

        this.loadProducts();
        this.loadKhata();
        this.loadDashboardSummary();
        this.loadFestivalAlerts();
      },
      error: (error) => {
        console.error('Login failed', error);
        alert('Invalid phone number or password. Please try again.');
      }
    });
  }

  onLogout(): void {
    this.isLoggedIn = false;
    this.activeTab = 'overview';
    localStorage.removeItem('kirana-user-role');
    localStorage.removeItem('kirana-user-phone');
    localStorage.removeItem('kirana-auth-token');
    this.clearInactivityTimer();
    this.loginForm = {
      phoneNumber: '',
      password: '',
      role: 'ADMIN'
    };
  }

  private attachInactivityWatcher(): void {
    const reset = () => {
      this.clearInactivityTimer();
      if (this.isLoggedIn) {
        this.inactivityTimer = setTimeout(() => {
          alert('Session expired due to inactivity. Please login again.');
          this.onLogout();
        }, this.inactivityMs);
      }
    };

    const events = ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach((eventName) => document.addEventListener(eventName, reset, { passive: true }));

    reset();
  }

  private clearInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  loadProducts(): void {
    this.inventoryService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
      },
      error: (error) => {
        console.error('Failed to load products', error);
      }
    });
  }

  loadKhata(): void {
    this.inventoryService.getKhata().subscribe({
      next: (data) => {
        this.khataLedger = data;
      },
      error: (error) => {
        console.error('Failed to load khata ledger', error);
      }
    });
  }

  loadDashboardSummary(): void {
    this.inventoryService.getDashboardSummary().subscribe({
      next: (summary) => {
        this.dashboardSummary = summary;
      },
      error: (error) => {
        console.error('Failed to load dashboard summary', error);
      }
    });
  }

  loadFestivalAlerts(): void {
    if (!this.isLoggedIn) {
      return;
    }

    this.inventoryService.getFestivalConfigs().subscribe({
      next: (configs) => {
        this.festivalConfigs = configs || [];
        if (this.festivalConfigs.length > 0) {
          const primary = [...this.festivalConfigs].sort((a, b) => a.daysBeforeAlert - b.daysBeforeAlert)[0];
          this.applyFestivalConfig(primary);
        }
      },
      error: () => {
        this.festivalAlert = {
          festival: 'Diwali Campaign',
          daysLeft: 15,
          message: 'Recommended stock: premium sweets, dry fruits, diyas, gifting packs.'
        };
      }
    });
  }

  private applyFestivalConfig(config: FestivalConfig): void {
    const categories = (config.recommendedCategories || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    this.festivalAlert = {
      festival: config.festivalName,
      daysLeft: config.daysBeforeAlert ?? 15,
      message: categories.length > 0
        ? `Recommended stock: ${categories.join(', ')}.`
        : 'Recommended stock: review seasonal inventory and prep for demand.'
    };
  }

  onProductSubmit(): void {
    if (!this.requireAdminAction('add stock')) {
      return;
    }

    const payload: Product = {
      ...this.productForm,
      id: undefined
    };

    this.inventoryService.addProduct(payload).subscribe({
      next: () => {
        this.productForm = {
          name: '',
          brand: '',
          category: 'General',
          currentStock: 0,
          minStockAlert: 0,
          purchasePrice: 0,
          mrp: 0
        };
        this.loadProducts();
        this.loadDashboardSummary();
      },
      error: (error) => {
        console.error('Failed to add product', error);
      }
    });
  }

  onKhataSubmit(): void {
    const customerName = this.khataForm.customerName?.trim();

    if (!customerName) {
      alert('Customer name is required.');
      return;
    }

    const payload: Khata = {
      ...this.khataForm,
      customerName,
      id: undefined
    };

    this.inventoryService.addKhata(payload).subscribe({
      next: () => {
        this.khataForm = {
          customerName: '',
          phoneNumber: '',
          outstandingBalance: 0
        };
        this.loadKhata();
        this.loadDashboardSummary();
      },
      error: (error) => {
        console.error('Failed to add khata entry', error);
        alert('Khata entry failed. Please enter a valid customer name and try again.');
      }
    });
  }

  totalInventoryValue(): number {
    if (this.dashboardSummary.inventoryValue) {
      return this.dashboardSummary.inventoryValue;
    }

    return this.products.reduce((sum, item) => sum + ((item.mrp ?? 0) * (item.currentStock ?? 0)), 0);
  }

  lowStockCount(): number {
    if (this.dashboardSummary.lowStockCount) {
      return this.dashboardSummary.lowStockCount;
    }

    return this.products.filter((item) => (item.currentStock ?? 0) <= (item.minStockAlert ?? 0)).length;
  }

  totalOutstandingBalance(): number {
    if (this.dashboardSummary.totalKhataOutstanding) {
      return this.dashboardSummary.totalKhataOutstanding;
    }

    return this.khataLedger.reduce((sum, entry) => sum + (entry.outstandingBalance ?? 0), 0);
  }

  khataEntriesCount(): number {
    if (this.dashboardSummary.totalKhataEntries) {
      return this.dashboardSummary.totalKhataEntries;
    }

    return this.khataLedger.length;
  }

  calculateComboBundle(): void {
    const selectedProduct = this.products.find((product) => product.id?.toString() === this.comboForm.selectedProductId);
    const unitCost = selectedProduct?.purchasePrice ?? 0;
    const quantity = Math.max(1, this.comboForm.quantity || 1);
    const bundlePrice = this.comboForm.bundlePrice || 0;
    const totalCost = unitCost * quantity;
    const profit = bundlePrice - totalCost;
    const markupPercent = totalCost > 0 ? (profit / totalCost) * 100 : 0;
    const marginPercent = bundlePrice > 0 ? (profit / bundlePrice) * 100 : 0;

    this.comboResult = {
      totalCost,
      profit,
      markupPercent,
      marginPercent
    };
  }

  resetComboCalculator(): void {
    this.comboForm = {
      selectedProductId: this.products[0]?.id?.toString() ?? '',
      bundlePrice: 0,
      quantity: 1
    };
    this.comboResult = {
      totalCost: 0,
      profit: 0,
      markupPercent: 0,
      marginPercent: 0
    };
  }

  exportSnapshot(): void {
    if (!this.requireAdminAction('export data')) {
      return;
    }
    alert('Export feature ready for CSV/Excel generation in the next backend phase.');
  }

  importSnapshot(): void {
    if (!this.requireAdminAction('import data')) {
      return;
    }
    alert('Import feature ready for CSV bulk upload in the next backend phase.');
  }
}
