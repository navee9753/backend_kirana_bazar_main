import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  KhataCustomer,
  KhataService,
  KhataTransaction,
  KhataTransactionType
} from '../../services/khata.service';

@Component({
  selector: 'app-khata-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './khata.component.html',
  styleUrls: ['./khata.component.css']
})
export class KhataPageComponent implements OnInit {
  customers: KhataCustomer[] = [];
  selectedCustomer: KhataCustomer | null = null;
  transactions: KhataTransaction[] = [];
  searchTerm = '';
  loading = false;
  transactionsLoading = false;
  savingCustomer = false;
  savingTransaction = false;
  showCustomerForm = false;
  transactionFormType: KhataTransactionType | null = null;
  loadError = '';
  customerError = '';
  transactionError = '';
  transactionAmount: number | null = null;
  transactionNotes = '';

  customerForm = {
    customerName: '',
    phoneNumber: '',
    address: '',
    creditLimit: 5000
  };

  constructor(private readonly khataService: KhataService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  get filteredCustomers(): KhataCustomer[] {
    const query = this.searchTerm.trim().toLocaleLowerCase();
    return this.customers.filter((customer) =>
      !query
      || customer.customerName.toLocaleLowerCase().includes(query)
      || (customer.phoneNumber ?? '').includes(query)
    );
  }

  get totalOutstanding(): number {
    return this.customers.reduce((sum, customer) =>
      sum + Math.max(Number(customer.outstandingBalance) || 0, 0), 0);
  }

  get customersOverLimit(): number {
    return this.customers.filter((customer) =>
      Number(customer.outstandingBalance) > Number(customer.creditLimit)
    ).length;
  }

  loadCustomers(selectId?: number): void {
    this.loading = true;
    this.loadError = '';
    this.khataService.getCustomers().subscribe({
      next: (customers) => {
        this.customers = customers;
        const selected = customers.find((customer) => customer.id === (selectId ?? this.selectedCustomer?.id));
        this.loading = false;
        if (selected) {
          this.selectCustomer(selected);
        } else if (!this.selectedCustomer && customers.length > 0) {
          this.selectCustomer(customers[0]);
        } else if (customers.length === 0) {
          this.selectedCustomer = null;
          this.transactions = [];
        }
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.loadError = this.messageFor(error);
      }
    });
  }

  selectCustomer(customer: KhataCustomer): void {
    this.selectedCustomer = customer;
    this.transactions = [];
    this.transactionsLoading = true;
    this.transactionError = '';
    this.transactionFormType = null;
    this.khataService.getTransactions(customer.id).subscribe({
      next: (transactions) => {
        if (this.selectedCustomer?.id === customer.id) {
          this.transactions = transactions;
          this.transactionsLoading = false;
        }
      },
      error: (error: HttpErrorResponse) => {
        if (this.selectedCustomer?.id === customer.id) {
          this.transactionsLoading = false;
          this.transactionError = this.messageFor(error);
        }
      }
    });
  }

  openCustomerForm(): void {
    this.customerError = '';
    this.customerForm = { customerName: '', phoneNumber: '', address: '', creditLimit: 5000 };
    this.showCustomerForm = true;
  }

  closeCustomerForm(): void {
    if (!this.savingCustomer) {
      this.showCustomerForm = false;
      this.customerError = '';
    }
  }

  saveCustomer(): void {
    const request = {
      customerName: this.customerForm.customerName.trim(),
      phoneNumber: this.customerForm.phoneNumber.trim(),
      address: this.customerForm.address.trim() || null,
      creditLimit: Number(this.customerForm.creditLimit)
    };
    if (!request.customerName) {
      this.customerError = 'Customer name is required.';
      return;
    }
    if (!/^\d{10,15}$/.test(request.phoneNumber)) {
      this.customerError = 'Enter a phone number containing 10 to 15 digits.';
      return;
    }
    if (!Number.isFinite(request.creditLimit) || request.creditLimit < 0) {
      this.customerError = 'Credit limit must be zero or more.';
      return;
    }

    this.savingCustomer = true;
    this.customerError = '';
    this.khataService.createCustomer(request).subscribe({
      next: (customer) => {
        this.savingCustomer = false;
        this.showCustomerForm = false;
        this.customers = [customer, ...this.customers].sort(
          (left, right) => Number(right.outstandingBalance) - Number(left.outstandingBalance)
        );
        this.selectCustomer(customer);
      },
      error: (error: HttpErrorResponse) => {
        this.savingCustomer = false;
        this.customerError = this.messageFor(error);
      }
    });
  }

  startTransaction(type: KhataTransactionType): void {
    this.transactionFormType = type;
    this.transactionAmount = null;
    this.transactionNotes = '';
    this.transactionError = '';
  }

  cancelTransaction(): void {
    if (!this.savingTransaction) {
      this.transactionFormType = null;
      this.transactionError = '';
    }
  }

  saveTransaction(): void {
    const customer = this.selectedCustomer;
    const amount = Number(this.transactionAmount);
    if (!customer || !this.transactionFormType) {
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      this.transactionError = 'Enter an amount greater than zero.';
      return;
    }

    this.savingTransaction = true;
    this.transactionError = '';
    this.khataService.createTransaction(customer.id, {
      transactionType: this.transactionFormType,
      amount,
      notes: this.transactionNotes.trim() || null
    }).subscribe({
      next: (updatedCustomer) => {
        this.customers = this.customers
          .map((item) => item.id === updatedCustomer.id ? updatedCustomer : item)
          .sort((left, right) => Number(right.outstandingBalance) - Number(left.outstandingBalance));
        this.selectedCustomer = updatedCustomer;
        this.transactionFormType = null;
        this.savingTransaction = false;
        this.loadTransactions(updatedCustomer.id);
      },
      error: (error: HttpErrorResponse) => {
        this.savingTransaction = false;
        this.transactionError = this.messageFor(error);
      }
    });
  }

  loadTransactions(customerId: number): void {
    this.transactionsLoading = true;
    this.khataService.getTransactions(customerId).subscribe({
      next: (transactions) => {
        if (this.selectedCustomer?.id === customerId) {
          this.transactions = transactions;
          this.transactionsLoading = false;
        }
      },
      error: (error: HttpErrorResponse) => {
        if (this.selectedCustomer?.id === customerId) {
          this.transactionsLoading = false;
          this.transactionError = this.messageFor(error);
        }
      }
    });
  }

  whatsappUrl(customer: KhataCustomer): string {
    const digits = (customer.phoneNumber ?? '').replace(/\D/g, '');
    const phone = digits.startsWith('91') ? digits : `91${digits.slice(-10)}`;
    const message = `Namaste ${customer.customerName}, this is a polite reminder from Naveen Kirana Bazar. Your pending Khata balance is ${this.formatCurrency(customer.outstandingBalance)}. Please settle it at your convenience. Thank you.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  creditUsage(customer: KhataCustomer): number {
    const limit = Number(customer.creditLimit);
    return limit > 0
      ? Math.min((Number(customer.outstandingBalance) / limit) * 100, 100)
      : (Number(customer.outstandingBalance) > 0 ? 100 : 0);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value) || 0);
  }

  initials(name: string): string {
    const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
    return parts.length > 1
      ? `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
      : (parts[0]?.charAt(0) ?? '?').toUpperCase();
  }

  trackCustomer(_: number, customer: KhataCustomer): number {
    return customer.id;
  }

  trackTransaction(_: number, transaction: KhataTransaction): number {
    return transaction.id;
  }

  private messageFor(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Cannot reach the server. Check that the backend is running.';
    }
    if (error.status === 401 || error.status === 403) {
      return 'Your session has expired or you are not allowed to do this. Please log in again.';
    }
    if (error.status === 409) {
      return 'A customer with this phone number already exists, or the stock changed. Refresh and try again.';
    }
    const serverMessage = error.error?.detail ?? error.error?.message;
    return typeof serverMessage === 'string' && serverMessage.trim()
      ? serverMessage
      : 'The request could not be completed. Please try again.';
  }
}
