import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { InventoryService, Supplier } from '../../services/inventory.service';

@Component({
  selector: 'app-suppliers-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './suppliers.component.html',
  styleUrls: ['./suppliers.component.css']
})
export class SuppliersPageComponent implements OnInit {
  suppliers: Supplier[] = [];
  importing = false;
  importMessage = '';
  importError = '';

  form: Partial<Supplier> = {
    name: '',
    contactPerson: '',
    phoneNumber: '',
    email: '',
    companyBrand: '',
    pendingPayable: 0,
    lastDeliveryDate: null
  };

  constructor(private readonly inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.inventoryService.getSuppliers().subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers ?? [];
      },
      error: () => {
        this.suppliers = [];
      }
    });
  }

  saveSupplier(): void {
    const name = (this.form.name ?? '').trim();
    const phoneNumber = (this.form.phoneNumber ?? '').trim();
    const pendingPayable = Number(this.form.pendingPayable ?? 0);

    if (!name || !phoneNumber || !Number.isFinite(pendingPayable)) {
      return;
    }

    const supplier: Supplier = {
      name,
      contactPerson: (this.form.contactPerson ?? '').trim(),
      phoneNumber,
      email: (this.form.email ?? '').trim(),
      companyBrand: (this.form.companyBrand ?? '').trim(),
      pendingPayable,
      lastDeliveryDate: this.form.lastDeliveryDate || null
    };

    this.inventoryService.addSupplier(supplier).subscribe({
      next: (saved) => {
        this.suppliers = [saved, ...this.suppliers.filter(item => item.id !== saved.id)];
        this.resetForm();
      },
      error: () => {
        this.suppliers = [supplier, ...this.suppliers];
        this.resetForm();
      }
    });
  }

  resetForm(): void {
    this.form = {
      name: '',
      contactPerson: '',
      phoneNumber: '',
      email: '',
      companyBrand: '',
      pendingPayable: 0,
      lastDeliveryDate: null
    };
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

  private messageForImportError(error: HttpErrorResponse): string {
    const serverMessage = error.error?.detail || error.error?.message || error.error?.error;
    if (serverMessage) {
      return String(serverMessage);
    }
    if (error.status === 0) {
      return 'Could not reach the server. Check your connection and try again.';
    }
    return 'Supplier import failed. Check the file headers and row values.';
  }
}
