import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { InventoryService, Product } from '../../services/inventory.service';

interface ProductRow {
  id: number;
  name: string;
  brand: string;
  barcode: string;
  sku: string;
  stock: number;
  min: number;
  purchase: number;
  mrp: number;
  category: string;
  isLooseItem: boolean;
  unit: string;
}

type InventoryFilter = 'all' | 'low' | 'out' | 'loose';

@Component({
  selector: 'app-inventory-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryPageComponent implements OnInit {
  inventory: ProductRow[] = [];
  searchInput = '';
  selectedCategory = 'All Categories';
  activeFilter: InventoryFilter = 'all';
  showForm = false;
  saving = false;
  loading = false;
  loadError = '';
  formError = '';
  editingId: number | null = null;
  savingStockId: number | null = null;
  deletingId: number | null = null;
  actionError = '';
  actionMessage = '';
  importing = false;
  importMessage = '';
  importError = '';
  readonly categories = ['Staples', 'Snacks', 'Dairy', 'Beverages', 'Household', 'Personal Care'];

  form = {
    name: '',
    brand: '',
    category: '',
    barcode: '',
    currentStock: 0,
    minStockAlert: 0,
    purchasePrice: 0,
    mrp: 0,
    isLooseItem: false
  };

  constructor(private readonly inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.load();
  }

  get filteredInventory(): ProductRow[] {
    const query = this.searchInput.trim().toLocaleLowerCase();
    return this.inventory.filter((item) => {
      const matchesSearch = !query
        || item.name.toLocaleLowerCase().includes(query)
        || item.brand.toLocaleLowerCase().includes(query)
        || item.barcode.toLocaleLowerCase().includes(query)
        || item.sku.toLocaleLowerCase().includes(query);
      const matchesCategory = this.selectedCategory === 'All Categories'
        || this.categoryMatches(item.category, this.selectedCategory);
      const matchesStatus = this.activeFilter === 'all'
        || (this.activeFilter === 'low' && item.stock > 0 && item.stock <= item.min)
        || (this.activeFilter === 'out' && item.stock <= 0)
        || (this.activeFilter === 'loose' && item.isLooseItem);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  load(): void {
    this.loading = true;
    this.loadError = '';
    this.inventoryService.getProducts().subscribe({
      next: (products: Product[]) => {
        this.inventory = products
          .filter((product): product is Product & { id: number } => product.id != null)
          .map((product) => ({
          id: product.id,
          name: product.name,
          brand: product.brand ?? '',
          barcode: product.barcode ?? '',
          sku: product.sku ?? '',
          category: product.category ?? '',
          stock: Number(product.currentStock ?? 0),
          min: Number(product.minStockAlert ?? 0),
          purchase: Number(product.purchasePrice ?? 0),
          mrp: Number(product.mrp ?? 0),
          isLooseItem: product.isLooseItem ?? false,
          unit: product.unit ?? 'units'
        }));
        this.loading = false;
      },
      error: () => {
        this.loadError = 'Could not load inventory. Check the server connection and try again.';
        this.loading = false;
      }
    });
  }

  openCreateForm(): void {
    this.editingId = null;
    this.form = {
      name: '',
      brand: '',
      category: '',
      barcode: '',
      currentStock: 0,
      minStockAlert: 0,
      purchasePrice: 0,
      mrp: 0,
      isLooseItem: false
    };
    this.formError = '';
    this.showForm = true;
  }

  editItem(item: ProductRow): void {
    this.editingId = item.id ?? null;
    this.form = {
      name: item.name,
      brand: item.brand ?? '',
      category: item.category ?? '',
      barcode: item.barcode ?? '',
      currentStock: item.stock,
      minStockAlert: item.min,
      purchasePrice: item.purchase,
      mrp: item.mrp,
      isLooseItem: item.isLooseItem
    };
    this.formError = '';
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.formError = '';
    this.editingId = null;
  }

  submitForm(): void {
    const payload: Product = {
      name: this.form.name.trim(),
      brand: this.form.brand.trim(),
      category: this.form.category.trim(),
      barcode: this.form.barcode.trim(),
      currentStock: Number(this.form.currentStock ?? 0),
      minStockAlert: Number(this.form.minStockAlert ?? 0),
      purchasePrice: Number(this.form.purchasePrice ?? 0),
      mrp: Number(this.form.mrp ?? 0),
      isLooseItem: this.form.isLooseItem
    };

    if (!payload.name) {
      this.formError = 'Product name is required.';
      return;
    }
    if (!payload.category) {
      this.formError = 'Category is required.';
      return;
    }
    const numericValues = [payload.currentStock, payload.minStockAlert, payload.purchasePrice, payload.mrp];
    if (numericValues.some((value) => !Number.isFinite(value) || value < 0)) {
      this.formError = 'Enter valid amounts and non-negative stock values.';
      return;
    }

    this.saving = true;
    this.formError = '';

    const request$ = this.editingId != null
      ? this.inventoryService.updateProduct(this.editingId, payload)
      : this.inventoryService.addProduct(payload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.closeForm();
        this.load();
      },
      error: () => {
        this.saving = false;
        this.formError = 'Unable to save the inventory item right now.';
      }
    });
  }

  deleteItem(item: ProductRow): void {
    if (!confirm(`Delete ${item.name}? This cannot be undone.`)) {
      return;
    }

    this.deletingId = item.id;
    this.actionError = '';
    this.actionMessage = '';
    this.inventoryService.deleteProduct(item.id).subscribe({
      next: () => {
        this.deletingId = null;
        this.actionMessage = `${item.name} was deleted.`;
        this.load();
      },
      error: () => {
        this.deletingId = null;
        this.actionError = 'Unable to delete this item. Please try again.';
      }
    });
  }

  adjustStock(item: ProductRow, adjustment: number): void {
    const nextStock = Math.round((item.stock + adjustment + Number.EPSILON) * 1000) / 1000;
    if (this.savingStockId != null || nextStock < 0) {
      return;
    }

    this.savingStockId = item.id;
    this.actionError = '';
    this.actionMessage = '';
    const product: Product = {
      id: item.id,
      name: item.name,
      brand: item.brand,
      category: item.category,
      barcode: item.barcode,
      sku: item.sku,
      currentStock: nextStock,
      minStockAlert: item.min,
      purchasePrice: item.purchase,
      mrp: item.mrp,
      isLooseItem: item.isLooseItem,
      unit: item.unit
    };

    this.inventoryService.updateProduct(item.id, product).subscribe({
      next: () => {
        this.savingStockId = null;
        this.actionMessage = `${item.name} stock updated.`;
        this.load();
      },
      error: () => {
        this.savingStockId = null;
        this.actionError = `Could not update stock for ${item.name}.`;
      }
    });
  }

  exportInventory(): void {
    this.actionError = '';
    this.actionMessage = '';
    this.inventoryService.exportProducts().subscribe({
      next: (file) => {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'kirana-inventory.csv';
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);
        this.actionMessage = 'Inventory backup downloaded.';
      },
      error: () => {
        this.actionError = 'Could not export inventory. Please try again.';
      }
    });
  }

  statusFor(item: ProductRow): 'Out of Stock' | 'Low Stock' | 'In Stock' {
    if (item.stock <= 0) {
      return 'Out of Stock';
    }
    return item.stock <= item.min ? 'Low Stock' : 'In Stock';
  }

  trackById(_index: number, item: ProductRow): number {
    return item.id;
  }

  private categoryMatches(itemCategory: string, selectedCategory: string): boolean {
    const normalized = itemCategory.trim().toLocaleLowerCase();
    if (selectedCategory === 'Staples') {
      return normalized === 'staples' || normalized === 'grocery' || normalized === 'groceries';
    }
    return normalized === selectedCategory.toLocaleLowerCase();
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
    this.inventoryService.importProducts(file).subscribe({
      next: (result) => {
        this.importing = false;
        this.importMessage = `${result.importedCount} product(s) imported.`;
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.importing = false;
        this.importError = this.messageForImportError(error);
      }
    });
  }

  private messageForImportError(error: HttpErrorResponse): string {
    const body: unknown = error.error;
    const serverMessage = this.extractServerMessage(body);
    if (serverMessage) {
      return serverMessage;
    }
    if (error.status === 413) {
      return 'The file is too large. The maximum upload size is 20 MB.';
    }
    if (error.status === 0) {
      return 'Could not reach the server. Check your connection and try again.';
    }
    return `Product import failed (HTTP ${error.status}). Check the backend response for details.`;
  }

  private extractServerMessage(body: unknown): string {
    if (typeof body === 'string') {
      return body.trim();
    }
    if (!body || typeof body !== 'object') {
      return '';
    }

    const response = body as Record<string, unknown>;
    for (const key of ['detail', 'message', 'error', 'title']) {
      const value = response[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    const errors = response['errors'];
    if (Array.isArray(errors)) {
      return errors.map((value) => String(value)).join(' ');
    }
    if (errors && typeof errors === 'object') {
      return Object.values(errors as Record<string, unknown>).map((value) => String(value)).join(' ');
    }
    return '';
  }
}
