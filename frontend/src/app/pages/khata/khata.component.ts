import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { InventoryService, Khata } from '../../services/inventory.service';

interface KhataRow {
  id?: number;
  customer: string;
  phone: string;
  amount: number;
  balance: string;
  status: 'Due' | 'Paid';
}

@Component({
  selector: 'app-khata-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './khata.component.html',
  styleUrls: ['./khata.component.css']
})
export class KhataPageComponent implements OnInit {
  entries: KhataRow[] = [];
  loading = false;
  saving = false;
  loadError = '';
  formError = '';
  showForm = false;

  form = {
    customerName: '',
    phoneNumber: '',
    outstandingBalance: null as number | null
  };

  constructor(private readonly inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.load();
  }

  get totalDue(): number {
    return this.entries.reduce((sum, row) => sum + (row.amount > 0 ? row.amount : 0), 0);
  }

  get totalDueLabel(): string {
    return this.formatCurrency(this.totalDue);
  }

  get dueCount(): number {
    return this.entries.filter((row) => row.status === 'Due').length;
  }

  load(): void {
    this.loading = true;
    this.loadError = '';

    this.inventoryService.getKhata().subscribe({
      next: (items: Khata[]) => {
        this.entries = items.map((item) => {
          const amount = Number(item.outstandingBalance ?? 0);
          return {
            id: item.id,
            customer: item.customerName,
            phone: item.phoneNumber ?? '',
            amount,
            balance: this.formatCurrency(amount),
            status: amount > 0 ? 'Due' : 'Paid'
          } as KhataRow;
        });
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.entries = [];
        this.loading = false;
        this.loadError = this.messageFor(err);
      }
    });
  }

  openForm(): void {
    this.formError = '';
    this.form = { customerName: '', phoneNumber: '', outstandingBalance: null };
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.formError = '';
  }

  save(): void {
    const name = this.form.customerName.trim();
    const phone = this.form.phoneNumber.trim();
    const amount = Number(this.form.outstandingBalance ?? 0);

    if (!name) {
      this.formError = 'Customer name is required.';
      return;
    }
    if (phone && !/^\d{10}$/.test(phone)) {
      this.formError = 'Enter a 10-digit phone number or leave it empty.';
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      this.formError = 'Amount must be zero or more.';
      return;
    }

    this.saving = true;
    this.formError = '';

    this.inventoryService
      .addKhata({ customerName: name, phoneNumber: phone, outstandingBalance: amount })
      .subscribe({
        next: () => {
          this.saving = false;
          this.closeForm();
          this.load();
        },
        error: (err: HttpErrorResponse) => {
          this.saving = false;
          this.formError = this.messageFor(err);
        }
      });
  }

  initials(name: string): string {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '?';
    }
    const first = parts[0].charAt(0);
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (first + last).toUpperCase();
  }

  trackById(_: number, row: KhataRow): number | undefined {
    return row.id;
  }

  private messageFor(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return 'Cannot reach the server. Check that the backend is running on port 8080.';
    }
    if (err.status === 401 || err.status === 403) {
      return 'Your session has expired or you are not allowed to do this. Please log in again.';
    }
    if (err.status === 400) {
      return 'The server rejected the entry. Check the customer name and amount.';
    }
    return 'Something went wrong. Please try again.';
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value ?? 0);
  }
}