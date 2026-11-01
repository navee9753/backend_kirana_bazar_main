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

export interface Supplier {
  id?: number;
  supplierName: string;
  firmName: string;
  phoneNumber?: string;
  email?: string;
  details?: string;
  address: string;
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
  private readonly supplierStorageKey = 'kirana-suppliers';

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('kirana-auth-token');
    if (!token || token === 'demo-token' || token.trim().length === 0) {
      localStorage.removeItem('kirana-auth-token');
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

  private readLocalSuppliers(): Supplier[] {
    const raw = localStorage.getItem(this.supplierStorageKey);
    if (!raw) {
      return [
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

    try {
      const parsed = JSON.parse(raw) as Supplier[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [
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
    } catch {
      return [
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
  }

  private persistLocalSuppliers(suppliers: Supplier[]): void {
    localStorage.setItem(this.supplierStorageKey, JSON.stringify(suppliers));
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

  updateProduct(id: number, product: Product): Observable<Product> {
    const currentProducts = this.readLocalProducts();
    const index = currentProducts.findIndex((item) => item.id === id);

    if (index !== -1) {
      const updated = { ...currentProducts[index], ...product, id };
      currentProducts[index] = updated;
      this.persistLocalProducts(currentProducts);
    }

    return this.http.put<Product>(`${this.productUrl}/${id}`, product, { headers: this.authHeaders() }).pipe(
      catchError(() => of({ ...product, id }))
    );
  }

  deleteProduct(id: number): Observable<void> {
    const currentProducts = this.readLocalProducts();
    const filtered = currentProducts.filter((item) => item.id !== id);
    this.persistLocalProducts(filtered);

    return this.http.delete<void>(`${this.productUrl}/${id}`, { headers: this.authHeaders() }).pipe(
      catchError(() => of())
    );
  }

  getKhata(): Observable<Khata[]> {
    return this.http.get<Khata[]>(this.khataUrl, { headers: this.authHeaders() });
  }

  getSuppliers(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(`${this.apiBaseUrl}/api/suppliers`, { headers: this.authHeaders() }).pipe(
      catchError(() => of(this.readLocalSuppliers()))
    );
  }

  addSupplier(supplier: Supplier): Observable<Supplier> {
    const currentSuppliers = this.readLocalSuppliers();
    const newSupplier: Supplier = {
      ...supplier,
      id: Date.now(),
      supplierName: supplier.supplierName.trim(),
      firmName: supplier.firmName.trim(),
      address: supplier.address.trim()
    };

    const updatedSuppliers = [newSupplier, ...currentSuppliers];
    this.persistLocalSuppliers(updatedSuppliers);

    return this.http.post<Supplier>(`${this.apiBaseUrl}/api/suppliers`, supplier, { headers: this.authHeaders() }).pipe(
      catchError(() => of(newSupplier))
    );
  }

  addKhata(entry: Khata): Observable<Khata> {
    return this.http.post<Khata>(this.khataUrl, entry, { headers: this.authHeaders() });
  }

  updateKhata(id: number, entry: Khata): Observable<Khata> {
    return this.http.put<Khata>(`${this.khataUrl}/${id}`, entry, { headers: this.authHeaders() });
  }

  deleteKhata(id: number): Observable<void> {
    return this.http.delete<void>(`${this.khataUrl}/${id}`, { headers: this.authHeaders() });
  }

  getFestivalConfigs(): Observable<FestivalConfig[]> {
    return this.http.get<FestivalConfig[]>(`${this.apiBaseUrl}/api/festivals`, { headers: this.authHeaders() });
  }

  loginUser(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.userUrl}/login`, payload);
  }
}
