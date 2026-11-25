import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export type KhataTransactionType = 'UDHAR_GIVEN' | 'PAYMENT_RECEIVED';

export interface KhataCustomer {
  id: number;
  customerName: string;
  phoneNumber: string | null;
  address: string | null;
  creditLimit: number;
  outstandingBalance: number;
  lastUpdated: string;
}

export interface KhataTransaction {
  id: number;
  customerId: number;
  transactionType: KhataTransactionType;
  amount: number;
  notes: string | null;
  transactionDate: string;
}

export interface KhataCustomerRequest {
  customerName: string;
  phoneNumber: string;
  address: string | null;
  creditLimit: number;
}

export interface KhataTransactionRequest {
  transactionType: KhataTransactionType;
  amount: number;
  notes: string | null;
}

export interface KhataCheckoutCreditRequest {
  customerId: number;
  totalAmount: number;
  itemsSummary: string;
  cartItems: Array<{ productId: number; quantity: number }>;
}

@Injectable({ providedIn: 'root' })
export class KhataService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/khata`;

  constructor(private readonly http: HttpClient) {}

  getCustomers(): Observable<KhataCustomer[]> {
    return this.http.get<KhataCustomer[]>(`${this.baseUrl}/customers`, {
      headers: this.authHeaders()
    });
  }

  createCustomer(request: KhataCustomerRequest): Observable<KhataCustomer> {
    return this.http.post<KhataCustomer>(`${this.baseUrl}/customers`, request, {
      headers: this.authHeaders()
    });
  }

  getTransactions(customerId: number): Observable<KhataTransaction[]> {
    return this.http.get<KhataTransaction[]>(`${this.baseUrl}/customers/${customerId}/transactions`, {
      headers: this.authHeaders()
    });
  }

  createTransaction(customerId: number, request: KhataTransactionRequest): Observable<KhataCustomer> {
    return this.http.post<KhataCustomer>(
      `${this.baseUrl}/customers/${customerId}/transactions`,
      request,
      { headers: this.authHeaders() }
    );
  }

  checkoutCredit(request: KhataCheckoutCreditRequest): Observable<KhataCustomer> {
    return this.http.post<KhataCustomer>(`${this.baseUrl}/checkout-credit`, request, {
      headers: this.authHeaders()
    });
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('kirana-auth-token');
    return token && token !== 'demo-token' && token.trim()
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }
}
