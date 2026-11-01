import { CommonModule } from '@angular/common';
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

  form: Partial<Supplier> = {
    supplierName: '',
    firmName: '',
    phoneNumber: '',
    email: '',
    details: '',
    address: ''
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
    const supplierName = (this.form.supplierName ?? '').trim();
    const firmName = (this.form.firmName ?? '').trim();
    const address = (this.form.address ?? '').trim();

    if (!supplierName || !firmName || !address) {
      return;
    }

    const supplier: Supplier = {
      supplierName,
      firmName,
      phoneNumber: (this.form.phoneNumber ?? '').trim(),
      email: (this.form.email ?? '').trim(),
      details: (this.form.details ?? '').trim(),
      address
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
      supplierName: '',
      firmName: '',
      phoneNumber: '',
      email: '',
      details: '',
      address: ''
    };
  }
}
