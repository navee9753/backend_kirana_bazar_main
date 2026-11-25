import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { InventoryService, Khata, Product, Supplier } from '../../services/inventory.service';
import { InactivitySessionService } from '../../services/inactivity-session.service';

interface FestivalSeason {
  name: string;
  month: number;
  day: number;
  categories: string;
}

interface FestivalAlert extends FestivalSeason {
  daysAway: number;
  state: 'urgent' | 'upcoming' | 'seasonal';
}

const FESTIVAL_SEASONS: FestivalSeason[] = [
  { name: 'Makar Sankranti', month: 1, day: 14, categories: 'Jaggery, sesame, ghee and festive staples' },
  { name: 'Holi season', month: 3, day: 14, categories: 'Colours, snacks, sweets and beverages' },
  { name: 'Baisakhi', month: 4, day: 13, categories: 'Grains, sweets and celebration essentials' },
  { name: 'Raksha Bandhan season', month: 8, day: 15, categories: 'Sweets, dry fruits and gift essentials' },
  { name: 'Ganesh Chaturthi season', month: 9, day: 7, categories: 'Puja essentials, sweets and offerings' },
  { name: 'Diwali procurement season', month: 11, day: 1, categories: 'Oil, diyas, sweets, dry fruits and gift packs' },
  { name: 'Christmas', month: 12, day: 25, categories: 'Baking supplies, chocolates and gifting' }
];

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardPageComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  khataEntries: Khata[] = [];
  suppliers: Supplier[] = [];
  loadErrors: string[] = [];
  loading = true;
  restockingProductId: number | null = null;
  restockError = '';
  exportError = '';
  exportMessage = '';
  readonly festivalAlert: FestivalAlert = this.getUpcomingFestival();
  readonly recommendations = [
    'Mustard Oil (Bulk)',
    'Desi Ghee',
    'Sugar & Jaggery',
    'Dry Fruits',
    'Besan & Maida'
  ];

  private readonly subscriptions = new Subscription();

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly inactivitySession: InactivitySessionService
  ) {}

  ngOnInit(): void {
    this.inactivitySession.start();
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get inventoryValue(): number {
    return this.products.reduce(
      (total, product) => total + Number(product.currentStock ?? 0) * Number(product.purchasePrice ?? 0),
      0
    );
  }

  get totalKhataOutstanding(): number {
    return this.khataEntries.reduce((total, entry) => total + Number(entry.outstandingBalance ?? 0), 0);
  }

  get totalSupplierPayables(): number {
    return this.suppliers.reduce((total, supplier) => total + Number(supplier.pendingPayable ?? 0), 0);
  }

  get lowStockCount(): number {
    return this.products.filter((product) =>
      Number(product.currentStock ?? 0) <= Number(product.minStockAlert ?? 0)
    ).length;
  }

  get outOfStockCount(): number {
    return this.products.filter((product) => Number(product.currentStock ?? 0) <= 0).length;
  }

  get lowStockProducts(): Product[] {
    return this.products
      .filter((product) =>
        Number(product.currentStock ?? 0) <= Number(product.minStockAlert ?? 0)
      )
      .sort((first, second) => {
        const firstStock = Number(first.currentStock ?? 0);
        const secondStock = Number(second.currentStock ?? 0);
        if (firstStock <= 0 && secondStock > 0) {
          return -1;
        }
        if (secondStock <= 0 && firstStock > 0) {
          return 1;
        }
        return firstStock - secondStock;
      });
  }

  get topKhataEntries(): Khata[] {
    return this.khataEntries
      .filter((entry) => Number(entry.outstandingBalance ?? 0) > 0)
      .sort((first, second) =>
        Number(second.outstandingBalance ?? 0) - Number(first.outstandingBalance ?? 0)
      )
      .slice(0, 5);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number.isFinite(value) ? value : 0);
  }

  formatStock(product: Product): string {
    const stock = Number(product.currentStock ?? 0);
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 3
    }).format(Number.isFinite(stock) ? stock : 0);
  }

  isOutOfStock(product: Product): boolean {
    return Number(product.currentStock ?? 0) <= 0;
  }

  whatsappLink(entry: Khata): string | null {
    const digits = (entry.phoneNumber ?? '').replace(/\D/g, '');
    const phone = digits.length === 10
      ? `91${digits}`
      : digits.length === 12 && digits.startsWith('91')
        ? digits
        : '';
    if (!phone) {
      return null;
    }

    const message = `Namaste ${entry.customerName}, this is a polite reminder from Naveen Kirana Bazar regarding your pending khata balance of ${this.formatCurrency(Number(entry.outstandingBalance ?? 0))}. Please let us know if you have any questions. Thank you.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  restock(product: Product): void {
    if (product.id == null || this.restockingProductId != null) {
      return;
    }

    const nextStock = Math.round((Number(product.currentStock ?? 0) + 10 + Number.EPSILON) * 1000) / 1000;
    const updatedProduct: Product = {
      ...product,
      currentStock: nextStock
    };
    this.restockingProductId = product.id;
    this.restockError = '';

    this.subscriptions.add(this.inventoryService.updateProduct(product.id, updatedProduct).subscribe({
      next: () => {
        this.restockingProductId = null;
        this.loadDashboard();
      },
      error: () => {
        this.restockingProductId = null;
        this.restockError = `Could not restock ${product.name}. Check the server connection and try again.`;
      }
    }));
  }

  exportInventory(): void {
    this.exportError = '';
    this.exportMessage = '';
    this.subscriptions.add(this.inventoryService.exportProducts().subscribe({
      next: (file) => {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'kirana-inventory.csv';
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);
        this.exportMessage = 'Inventory backup downloaded.';
      },
      error: () => {
        this.exportError = 'Could not download the inventory backup. Please try again.';
      }
    }));
  }

  private loadDashboard(): void {
    this.loading = true;
    this.loadErrors = [];
    this.subscriptions.add(forkJoin({
      products: this.inventoryService.getProducts().pipe(
        catchError(() => {
          this.loadErrors.push('Inventory data could not be loaded.');
          return of([] as Product[]);
        })
      ),
      khata: this.inventoryService.getKhata().pipe(
        catchError(() => {
          this.loadErrors.push('Khata balances could not be loaded.');
          return of([] as Khata[]);
        })
      ),
      suppliers: this.inventoryService.getSuppliers().pipe(
        catchError(() => {
          this.loadErrors.push('Supplier payables could not be loaded.');
          return of([] as Supplier[]);
        })
      )
    }).subscribe({
      next: ({ products, khata, suppliers }) => {
        this.products = products;
        this.khataEntries = khata;
        this.suppliers = suppliers;
        this.loading = false;
      },
      error: () => {
        this.loadErrors = ['Dashboard data could not be loaded. Please try again.'];
        this.loading = false;
      }
    }));
  }

  private getUpcomingFestival(): FestivalAlert {
    const today = new Date();
    const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const candidates = FESTIVAL_SEASONS.map((festival) => {
      const dateThisYear = Date.UTC(today.getFullYear(), festival.month - 1, festival.day);
      const date = dateThisYear >= todayUtc
        ? dateThisYear
        : Date.UTC(today.getFullYear() + 1, festival.month - 1, festival.day);
      return { festival, daysAway: Math.ceil((date - todayUtc) / 86_400_000) };
    }).sort((first, second) => first.daysAway - second.daysAway);

    const closest = candidates[0];
    return {
      ...closest.festival,
      daysAway: closest.daysAway,
      state: closest.daysAway <= 7 ? 'urgent' : closest.daysAway <= 30 ? 'upcoming' : 'seasonal'
    };
  }
}
