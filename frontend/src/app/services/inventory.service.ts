import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Product {
  id?: number;
  name: string;
  brand: string;
  category: string;
  currentStock: number;
  minStockAlert: number;
  purchasePrice: number;
  mrp: number;
}

export interface Khata {
  id?: number;
  customerName: string;
  phoneNumber: string;
  outstandingBalance: number;
  lastUpdated?: string;
}

export interface DashboardSummary {
  totalProducts: number;
  lowStockCount: number;
  inventoryValue: number;
  totalKhataOutstanding: number;
  totalKhataEntries: number;
}

export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

export interface LoginResponse {
  userId?: string;
  phoneNumber: string;
  role: 'ADMIN' | 'WORKER' | 'ROLE_ADMIN' | 'ROLE_WORKER';
  token?: string;
}

export interface FestivalConfig {
  id?: number;
  festivalName: string;
  daysBeforeAlert: number;
  recommendedCategories: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private readonly apiBaseUrl = environment.apiBaseUrl;
  private readonly productUrl = `${this.apiBaseUrl}/api/products`;
  private readonly khataUrl = `${this.apiBaseUrl}/api/khata`;
  private readonly userUrl = `${this.apiBaseUrl}/api/users`;

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('kirana-auth-token');
    if (!token) {
      return new HttpHeaders();
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.productUrl, { headers: this.authHeaders() });
  }

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiBaseUrl}/api/dashboard/summary`, { headers: this.authHeaders() });
  }

  addProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(this.productUrl, product, { headers: this.authHeaders() });
  }

  getKhata(): Observable<Khata[]> {
    return this.http.get<Khata[]>(this.khataUrl, { headers: this.authHeaders() });
  }

  addKhata(entry: Khata): Observable<Khata> {
    return this.http.post<Khata>(this.khataUrl, entry, { headers: this.authHeaders() });
  }

  getFestivalConfigs(): Observable<FestivalConfig[]> {
    return this.http.get<FestivalConfig[]>(`${this.apiBaseUrl}/api/festivals`, { headers: this.authHeaders() });
  }

  loginUser(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.userUrl}/login`, payload);
  }
}
