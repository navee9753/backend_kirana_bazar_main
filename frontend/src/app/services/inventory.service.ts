import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
  salePrice?: number;
  unit?: string;
  sku?: string;
  hsn?: string;
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
  private readonly localStorageKey = 'kirana-inventory-products';

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

  private readLocalProducts(): Product[] {
    const raw = localStorage.getItem(this.localStorageKey);
    if (!raw) {
      return this.defaultProducts();
    }

    try {
      const parsed = JSON.parse(raw) as Product[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : this.defaultProducts();
    } catch {
      return this.defaultProducts();
    }
  }

  private persistLocalProducts(products: Product[]): void {
    localStorage.setItem(this.localStorageKey, JSON.stringify(products));
  }

  private defaultProducts(): Product[] {
    const products: Product[] = [
      {
        id: 1,
        name: 'Rice Bag',
        brand: 'Hulchul',
        category: 'Groceries',
        currentStock: 48,
        minStockAlert: 12,
        purchasePrice: 1900,
        mrp: 2200,
        salePrice: 2200,
        unit: 'kg',
        sku: 'RICE-001',
        hsn: '1006'
      },
      {
        id: 2,
        name: 'Atta',
        brand: 'Shakti',
        category: 'Groceries',
        currentStock: 18,
        minStockAlert: 15,
        purchasePrice: 760,
        mrp: 890,
        salePrice: 890,
        unit: 'kg',
        sku: 'ATTA-001',
        hsn: '1101'
      },
      {
        id: 3,
        name: 'Cooking Oil',
        brand: 'Fortune',
        category: 'Groceries',
        currentStock: 7,
        minStockAlert: 12,
        purchasePrice: 1450,
        mrp: 1680,
        salePrice: 1680,
        unit: 'L',
        sku: 'OIL-001',
        hsn: '1515'
      }
    ];

    this.persistLocalProducts(products);
    return products;
  }

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.productUrl, { headers: this.authHeaders() }).pipe(
      catchError(() => of(this.readLocalProducts()))
    );
  }

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiBaseUrl}/api/dashboard/summary`, { headers: this.authHeaders() });
  }

  addProduct(product: Product): Observable<Product> {
    const currentProducts = this.readLocalProducts();
    const newProduct: Product = {
      ...product,
      id: Date.now(),
      currentStock: Number(product.currentStock ?? 0),
      minStockAlert: Number(product.minStockAlert ?? 0),
      purchasePrice: Number(product.purchasePrice ?? 0),
      mrp: Number(product.mrp ?? 0),
      salePrice: Number(product.salePrice ?? product.mrp ?? 0)
    };

    const updatedProducts = [newProduct, ...currentProducts];
    this.persistLocalProducts(updatedProducts);

    return this.http.post<Product>(this.productUrl, product, { headers: this.authHeaders() }).pipe(
      catchError(() => of(newProduct))
    );
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
