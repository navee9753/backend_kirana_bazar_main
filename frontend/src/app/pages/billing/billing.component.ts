import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { InventoryService, Khata, Product } from '../../services/inventory.service';

type ProductCategory = 'Staples' | 'Snacks' | 'Dairy' | 'Personal Care';
type PaymentMethod = 'Cash' | 'UPI / Online' | 'Udhar Khata';

interface CartLine {
  product: Product;
  quantity: number;
  unitPrice: number;
}

@Component({
  selector: 'app-billing-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.css']
})
export class BillingPageComponent implements OnInit, OnDestroy {
  readonly categories: ProductCategory[] = ['Staples', 'Snacks', 'Dairy', 'Personal Care'];
  products: Product[] = [];
  cart: CartLine[] = [];
  searchTerm = '';
  selectedCategory: ProductCategory | 'All' = 'All';
  customDiscount = 0;
  cashReceived: number | null = null;
  customerName = '';
  customerPhone = '';
  loading = true;
  settling = false;
  loadError = '';
  settlementError = '';

  private readonly subscriptions = new Subscription();

  constructor(private readonly inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.subscriptions.add(this.inventoryService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.loadError = 'Products could not be loaded. Please try again.';
      }
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get filteredProducts(): Product[] {
    const query = this.searchTerm.trim().toLocaleLowerCase();
    return this.products.filter((product) => {
      const matchesSearch = !query
        || product.name.toLocaleLowerCase().includes(query)
        || (product.brand ?? '').toLocaleLowerCase().includes(query);
      const matchesCategory = this.selectedCategory === 'All'
        || this.categoryFor(product) === this.selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }

  get grossTotal(): number {
    return this.cart.reduce((total, line) => total + line.quantity * line.unitPrice, 0);
  }

  get validDiscount(): number {
    const discount = Number(this.customDiscount);
    return Number.isFinite(discount) ? Math.min(Math.max(0, discount), this.grossTotal) : 0;
  }

  get netPayable(): number {
    return Math.max(0, this.grossTotal - this.validDiscount);
  }

  get changeDue(): number {
    return Math.max(0, Number(this.cashReceived ?? 0) - this.netPayable);
  }

  get discountIsValid(): boolean {
    const discount = Number(this.customDiscount);
    return Number.isFinite(discount) && discount >= 0 && discount <= this.grossTotal;
  }

  addToCart(product: Product): void {
    this.settlementError = '';
    const existing = this.cart.find((line) => line.product.id === product.id);
    const currentQuantity = existing?.quantity ?? 0;
    if (currentQuantity >= Number(product.currentStock)) {
      this.settlementError = `Only ${product.currentStock} ${product.unit || 'units'} of ${product.name} are in stock.`;
      return;
    }

    if (existing) {
      existing.quantity += 1;
    } else {
      this.cart = [...this.cart, {
        product,
        quantity: 1,
        unitPrice: Number(product.salePrice ?? product.mrp ?? 0)
      }];
    }
  }

  changeQuantity(line: CartLine, change: number): void {
    this.settlementError = '';
    const nextQuantity = line.quantity + change;
    if (nextQuantity <= 0) {
      this.cart = this.cart.filter((item) => item !== line);
      return;
    }
    if (nextQuantity > Number(line.product.currentStock)) {
      this.settlementError = `Only ${line.product.currentStock} ${line.product.unit || 'units'} of ${line.product.name} are in stock.`;
      return;
    }
    line.quantity = nextQuantity;
  }

  newBill(): void {
    if (this.settling) {
      return;
    }
    this.cart = [];
    this.customDiscount = 0;
    this.cashReceived = null;
    this.customerName = '';
    this.customerPhone = '';
    this.settlementError = '';
  }

  settle(method: PaymentMethod): void {
    this.settlementError = '';
    if (this.settling || this.cart.length === 0) {
      return;
    }
    if (!this.discountIsValid) {
      this.settlementError = 'Discount must be between zero and the gross total.';
      return;
    }
    if (method === 'Cash' && Number(this.cashReceived ?? 0) < this.netPayable) {
      this.settlementError = 'Cash received must cover the net payable amount.';
      return;
    }
    if (method === 'Udhar Khata' && !this.customerName.trim()) {
      this.settlementError = 'Enter a customer name to add this bill to khata.';
      return;
    }
    if (method === 'Udhar Khata' && this.customerPhone.trim() && !/^\d{10}$/.test(this.customerPhone.trim())) {
      this.settlementError = 'Enter a valid 10-digit customer phone number or leave it empty.';
      return;
    }
    if (this.cart.some((line) => line.product.id == null)) {
      this.settlementError = 'A product is missing its inventory ID. Reload products before billing.';
      return;
    }

    const receiptWindow = window.open('', '_blank', 'width=420,height=720');
    if (!receiptWindow) {
      this.settlementError = 'Allow pop-ups to print the receipt, then try again.';
      return;
    }

    const purchasedLines = this.cart.map((line) => ({ ...line }));
    const methodLabel = method;
    this.settling = true;
    const stockUpdates = purchasedLines.map((line) => {
      const product = line.product;
      return this.inventoryService.updateProduct(product.id!, {
        ...product,
        currentStock: Number(product.currentStock) - line.quantity
      });
    });

    const settlement$ = forkJoin(stockUpdates).pipe(
      switchMap(() => {
        if (method !== 'Udhar Khata') {
          return of(null);
        }
        const entry: Khata = {
          customerName: this.customerName.trim(),
          phoneNumber: this.customerPhone.trim(),
          outstandingBalance: this.netPayable
        };
        return this.inventoryService.addKhata(entry);
      })
    );

    this.subscriptions.add(settlement$.subscribe({
      next: () => {
        const receipt = this.buildReceipt(purchasedLines, methodLabel);
        this.writeReceipt(receiptWindow, receipt);
        this.products = this.products.map((product) => {
          const purchased = purchasedLines.find((line) => line.product.id === product.id);
          return purchased
            ? { ...product, currentStock: Number(product.currentStock) - purchased.quantity }
            : product;
        });
        this.cart = [];
        this.customDiscount = 0;
        this.cashReceived = null;
        if (method === 'Udhar Khata') {
          this.customerName = '';
          this.customerPhone = '';
        }
        this.settling = false;
      },
      error: () => {
        receiptWindow.close();
        this.settling = false;
        this.settlementError = 'The bill could not be completed. Check inventory and khata, then try again.';
      }
    }));
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  private categoryFor(product: Product): ProductCategory | null {
    const source = `${product.category} ${product.name} ${product.brand}`.toLocaleLowerCase();
    if (/dairy|milk|curd|yogurt|paneer|cheese|butter|ghee/.test(source)) {
      return 'Dairy';
    }
    if (/personal care|personal-care|soap|shampoo|toothpaste|toothbrush|skin care|cosmetic/.test(source)) {
      return 'Personal Care';
    }
    if (/snack|biscuit|cookie|chips|namkeen|noodle|chocolate|confection/.test(source)) {
      return 'Snacks';
    }
    if (/staple|grocery|groceries|grain|rice|atta|flour|pulse|dal|oil|salt|sugar|spice/.test(source)) {
      return 'Staples';
    }
    return null;
  }

  private buildReceipt(lines: CartLine[], method: PaymentMethod): string {
    const rows = lines.map((line) => `
      <tr>
        <td>${this.escapeHtml(line.product.name)} × ${line.quantity}</td>
        <td>${this.formatCurrency(line.quantity * line.unitPrice)}</td>
      </tr>
    `).join('');
    const change = method === 'Cash' ? this.changeDue : 0;
    const customer = method === 'Udhar Khata' ? `<p>Customer: ${this.escapeHtml(this.customerName.trim())}</p>` : '';

    return `<!doctype html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Naveen Kirana Bazar receipt</title>
        <style>
          body{font:14px/1.5 Arial,sans-serif;color:#172b25;margin:24px}
          h1{font-size:20px;margin:0}p{margin:5px 0}
          table{width:100%;border-collapse:collapse;margin:18px 0}
          td{padding:8px 0;border-bottom:1px solid #ddd}
          td:last-child{text-align:right;white-space:nowrap}
          .total{font-weight:bold;font-size:17px}
          @media print{body{margin:10mm}}
        </style>
      </head>
      <body>
        <h1>Naveen Kirana Bazar</h1>
        <p>${new Date().toLocaleString('en-IN')}</p>
        <p>Payment: ${this.escapeHtml(method)}</p>
        ${customer}
        <table><tbody>${rows}</tbody></table>
        <p>Gross total: ${this.formatCurrency(this.grossTotal)}</p>
        <p>Discount: ${this.formatCurrency(this.validDiscount)}</p>
        <p class="total">Net payable: ${this.formatCurrency(this.netPayable)}</p>
        ${method === 'Cash' ? `<p>Cash received: ${this.formatCurrency(Number(this.cashReceived ?? 0))}</p><p>Change: ${this.formatCurrency(change)}</p>` : ''}
      </body>
      </html>`;
  }

  private writeReceipt(receiptWindow: Window, receipt: string): void {
    receiptWindow.document.open();
    receiptWindow.document.write(receipt);
    receiptWindow.document.close();
    receiptWindow.addEventListener('load', () => {
      receiptWindow.focus();
      receiptWindow.print();
    }, { once: true });
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character] ?? character);
  }
}
