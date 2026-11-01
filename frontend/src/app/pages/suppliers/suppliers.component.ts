import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface Supplier {
  id: number;
  supplierName: string;
  firmName: string;
  phoneNumber: string;
  email: string;
  details: string;
  address: string;
}

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

  readonly storageKey = 'kirana-suppliers';

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    const saved = localStorage.getItem(this.storageKey);
    this.suppliers = saved ? JSON.parse(saved) as Supplier[] : [
      {
        id: 1,
        supplierName: 'Rajesh Kumar',
        firmName: 'Kamal Traders',
        phoneNumber: '9876543210',
        email: 'kamaltraders@gmail.com',
        details: 'Wholesale rice and pulses supplier',
        address: 'Market Road, Jaipur'
      }
    ];
  }

  saveSupplier(): void {
    const supplierName = (this.form.supplierName ?? '').trim();
    const firmName = (this.form.firmName ?? '').trim();
    const address = (this.form.address ?? '').trim();

    if (!supplierName || !firmName || !address) {
      return;
    }

    const supplier: Supplier = {
      id: Date.now(),
      supplierName,
      firmName,
      phoneNumber: (this.form.phoneNumber ?? '').trim(),
      email: (this.form.email ?? '').trim(),
      details: (this.form.details ?? '').trim(),
      address
    };

    const existing = this.suppliers ?? [];
    const updated = [supplier, ...existing];
    this.suppliers = updated;
    localStorage.setItem(this.storageKey, JSON.stringify(updated));
    this.resetForm();
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
