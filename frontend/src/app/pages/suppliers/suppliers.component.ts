import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  InventoryService,
  Product,
  Supplier,
  SupplierPurchase
} from '../../services/inventory.service';

@Component({
  selector: 'app-suppliers-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './suppliers.component.html',
  styleUrls: ['./suppliers.component.css']
})
export class SuppliersPageComponent implements OnInit, OnDestroy {
  suppliers: Supplier[] = [];
  products: Product[] = [];
  importing = false;
  importMessage = '';
  importError = '';
  showSupplierModal = false;
  savingSupplier = false;
  supplierError = '';
  purchaseSupplier: Supplier | null = null;
  savingPurchase = false;
  purchaseError = '';
  purchaseHistory: Record<number, SupplierPurchase[]> = {};
  loadingHistory: Record<number, boolean> = {};
  historyErrors: Record<number, string> = {};
  expandedHistorySupplierId: number | null = null;
  toastMessage = '';

  form: Partial<Supplier> = this.emptySupplierForm();
  purchaseForm = {
    productId: null as number | null,
    quantityPurchased: 1,
    purchaseRate: 0
  };

  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadProducts();
  }

  ngOnDestroy(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  get estimatedTotal(): number {
    const quantity = Number(this.purchaseForm.quantityPurchased);
    const rate = Number(this.purchaseForm.purchaseRate);
    return Number.isFinite(quantity) && Number.isFinite(rate) ? quantity * rate : 0;
  }

  get selectedProduct(): Product | undefined {
    return this.products.find(product => product.id === Number(this.purchaseForm.productId));
  }

  loadSuppliers(): void {
    this.inventoryService.getSuppliers().subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers ?? [];
      },
      error: (error: HttpErrorResponse) => {
        this.importError = this.messageForError(error, 'Could not load suppliers. Please try again.');
      }
    });
  }

  loadProducts(): void {
    this.inventoryService.getProducts().subscribe({
      next: (products) => {
        this.products = products ?? [];
      },
      error: () => {
        this.products = [];
      }
    });
  }

  openSupplierModal(): void {
    this.form = this.emptySupplierForm();
    this.supplierError = '';
    this.showSupplierModal = true;
  }

  closeSupplierModal(): void {
    if (this.savingSupplier) {
      return;
    }
    this.showSupplierModal = false;
    this.supplierError = '';
  }

  saveSupplier(): void {
    const name = (this.form.name ?? '').trim();
    const phoneNumber = (this.form.phoneNumber ?? '').trim();
    const pendingPayable = Number(this.form.pendingPayable ?? 0);

    if (!name || !phoneNumber || !Number.isFinite(pendingPayable) || pendingPayable < 0) {
      this.supplierError = 'Enter a supplier name, phone number, and valid non-negative balance.';
      return;
    }

    const supplier: Supplier = {
      name,
      contactPerson: (this.form.contactPerson ?? '').trim(),
      phoneNumber,
      email: (this.form.email ?? '').trim(),
      companyBrand: (this.form.companyBrand ?? '').trim(),
      pendingPayable,
      lastDeliveryDate: null
    };

    this.savingSupplier = true;
    this.supplierError = '';
    this.inventoryService.addSupplier(supplier).subscribe({
      next: () => {
        this.savingSupplier = false;
        this.showSupplierModal = false;
        this.loadSuppliers();
        this.showToast('Supplier added successfully.');
      },
      error: (error: HttpErrorResponse) => {
        this.savingSupplier = false;
        this.supplierError = this.messageForError(error, 'Supplier could not be saved. Please try again.');
      }
    });
  }

  openPurchasePanel(supplier: Supplier): void {
    this.purchaseSupplier = supplier;
    this.purchaseForm = {
      productId: null,
      quantityPurchased: 1,
      purchaseRate: 0
    };
    this.purchaseError = '';
  }

  closePurchasePanel(): void {
    if (this.savingPurchase) {
      return;
    }
    this.purchaseSupplier = null;
    this.purchaseError = '';
  }

  onPurchaseProductChange(): void {
    const product = this.selectedProduct;
    this.purchaseForm.purchaseRate = product ? Number(product.purchasePrice) : 0;
  }

  recordPurchase(): void {
    const supplierId = this.purchaseSupplier?.id;
    const productId = Number(this.purchaseForm.productId);
    const quantityPurchased = Number(this.purchaseForm.quantityPurchased);
    const purchaseRate = Number(this.purchaseForm.purchaseRate);

    if (!supplierId || !productId || !Number.isSafeInteger(quantityPurchased) || quantityPurchased <= 0 ||
      !Number.isFinite(purchaseRate) || purchaseRate < 0) {
      this.purchaseError = 'Choose a product and enter a positive whole quantity and valid buying rate.';
      return;
    }

    this.savingPurchase = true;
    this.purchaseError = '';
    this.inventoryService.recordSupplierPurchase(supplierId, {
      productId,
      quantityPurchased,
      purchaseRate
    }).subscribe({
      next: () => {
        this.savingPurchase = false;
        this.purchaseSupplier = null;
        this.loadSuppliers();
        this.loadProducts();
        if (this.expandedHistorySupplierId === supplierId) {
          this.loadPurchaseHistory(supplierId);
        }
        this.showToast('Purchase recorded successfully.');
      },
      error: (error: HttpErrorResponse) => {
        this.savingPurchase = false;
        this.purchaseError = this.messageForError(error, 'Purchase could not be recorded. Please try again.');
      }
    });
  }

  togglePurchaseHistory(supplier: Supplier): void {
    if (!supplier.id) {
      return;
    }
    if (this.expandedHistorySupplierId === supplier.id) {
      this.expandedHistorySupplierId = null;
      return;
    }
    this.expandedHistorySupplierId = supplier.id;
    this.loadPurchaseHistory(supplier.id);
  }

  loadPurchaseHistory(supplierId: number): void {
    this.loadingHistory[supplierId] = true;
    this.historyErrors[supplierId] = '';
    this.inventoryService.getSupplierPurchases(supplierId).subscribe({
      next: (purchases) => {
        this.purchaseHistory[supplierId] = purchases ?? [];
        this.loadingHistory[supplierId] = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loadingHistory[supplierId] = false;
        this.historyErrors[supplierId] = this.messageForError(error, 'Purchase history could not be loaded.');
      }
    });
  }

  productName(productId: number): string {
    return this.products.find(product => product.id === productId)?.name ?? `Product #${productId}`;
  }

  importFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    this.importMessage = '';
    this.importError = '';

    if (!file) {
      return;
    }
    if (!/\.(csv|xls|xlsx)$/i.test(file.name)) {
      this.importError = 'Choose a CSV, XLS, or XLSX file.';
      return;
    }

    this.importing = true;
    this.inventoryService.importSuppliers(file).subscribe({
      next: (result) => {
        this.importing = false;
        this.importMessage = `${result.importedCount} supplier(s) imported.`;
        this.loadSuppliers();
      },
      error: (error: HttpErrorResponse) => {
        this.importing = false;
        this.importError = this.messageForImportError(error);
      }
    });
  }

  private emptySupplierForm(): Partial<Supplier> {
    return {
      name: '',
      contactPerson: '',
      phoneNumber: '',
      email: '',
      companyBrand: '',
      pendingPayable: 0
    };
  }

  private showToast(message: string): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastMessage = message;
    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
      this.toastTimer = null;
    }, 3500);
  }

  private messageForImportError(error: HttpErrorResponse): string {
    return this.messageForError(error, 'Supplier import failed. Check the file headers and row values.');
  }

  private messageForError(error: HttpErrorResponse, fallback: string): string {
    const serverMessage = error.error?.detail || error.error?.message || error.error?.error;
    if (serverMessage) {
      return String(serverMessage);
    }
    if (error.status === 0) {
      return 'Could not reach the server. Check your connection and try again.';
    }
    return fallback;
  }
}
