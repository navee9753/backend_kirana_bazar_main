import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { InventoryService, Product } from '../../services/inventory.service';

interface ProductRow {
  id?: number;
  name: string;
  brand: string;
  stock: number;
  min: number;
  purchase: number;
  mrp: number;
  category: string;
}

@Component({
  selector: 'app-inventory-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryPageComponent implements OnInit {
  inventory: ProductRow[] = [];
  showForm = false;
  saving = false;
  formError = '';
  editingId: number | null = null;
  importing = false;
  importMessage = '';
  importError = '';

  form = {
    name: '',
    brand: '',
    category: '',
    currentStock: 0,
    minStockAlert: 0,
    purchasePrice: 0,
    mrp: 0
  };

  constructor(private readonly inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.inventoryService.getProducts().subscribe({
      next: (products: Product[]) => {
        this.inventory = products.map((product) => ({
          id: product.id,
          name: product.name,
          brand: product.brand,
          category: product.category,
          stock: Number(product.currentStock ?? 0),
          min: Number(product.minStockAlert ?? 0),
          purchase: Number(product.purchasePrice ?? 0),
          mrp: Number(product.mrp ?? 0)
        }));
      },
      error: () => {
        this.inventory = [];
      }
    });
  }

  openCreateForm(): void {
    this.editingId = null;
    this.form = {
      name: '',
      brand: '',
      category: '',
      currentStock: 0,
      minStockAlert: 0,
      purchasePrice: 0,
      mrp: 0
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
      currentStock: item.stock,
      minStockAlert: item.min,
      purchasePrice: item.purchase,
      mrp: item.mrp
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
      currentStock: Number(this.form.currentStock ?? 0),
      minStockAlert: Number(this.form.minStockAlert ?? 0),
      purchasePrice: Number(this.form.purchasePrice ?? 0),
      mrp: Number(this.form.mrp ?? 0)
    };

    if (!payload.name) {
      this.formError = 'Product name is required.';
      return;
    }
    if (!payload.category) {
      this.formError = 'Category is required.';
      return;
    }
    if (payload.currentStock < 0 || payload.minStockAlert < 0 || payload.purchasePrice < 0 || payload.mrp < 0) {
      this.formError = 'Amounts and stock values cannot be negative.';
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
    if (!item.id || !confirm(`Delete ${item.name}?`)) {
      return;
    }

    this.inventoryService.deleteProduct(item.id).subscribe({
      next: () => this.load(),
      error: () => alert('Unable to delete the item right now.')
    });
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

  downloadImportTemplate(): void {
    const csv = [
      'name,brand,category,current_stock,min_stock_alert,purchase_price,mrp',
      'Rice Bag,Hulchul,Groceries,48,12,1900.00,2200.00'
    ].join('\r\n');
    const file = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inventory-import-template.csv';
    link.click();
    URL.revokeObjectURL(url);
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
