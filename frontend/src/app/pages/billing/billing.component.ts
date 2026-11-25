import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QRCodeModule } from 'angularx-qrcode';
import { Subscription } from 'rxjs';

import { InventoryService, Product } from '../../services/inventory.service';
import { KhataCustomer, KhataService } from '../../services/khata.service';

type ProductCategory = 'Staples' | 'Snacks' | 'Dairy' | 'Personal Care';
type PaymentMethod = 'Cash' | 'UPI / Online' | 'Udhar Khata';

interface CartLine {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal?: number;
}

@Component({
  selector: 'app-billing-page',
  standalone: true,
  imports: [CommonModule, FormsModule, QRCodeModule],
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.css']
})
export class BillingPageComponent implements OnInit, OnDestroy {
  readonly shopUpiId = '9753583488@ybl';
  readonly shopName = 'Naveen Kirana Bazar';
  readonly categories: ProductCategory[] = ['Staples', 'Snacks', 'Dairy', 'Personal Care'];
  products: Product[] = [];
  cart: CartLine[] = [];
  activeUtility: 'loose' | 'upi' | null = null;
  utilityCalculatorMode: 'weight' | 'amount' = 'weight';
  utilityItemName = '';
  utilityPricePerKg: number | null = null;
  utilityWeightInput: number | null = 500;
  utilityWeightUnit: 'g' | 'kg' = 'g';
  utilityAmountInput: number | null = null;
  utilityUpiId = this.shopUpiId;
  utilityUpiAmount: number | null = null;
  showUpiModal = false;
  upiQrString = '';
  searchTerm = '';
  selectedCategory: ProductCategory | 'All' = 'All';
  looseOnly = false;
  calculatorProduct: Product | null = null;
  calculatorMode: 'weight' | 'amount' = 'weight';
  calculatorWeightUnit: 'g' | 'kg' = 'g';
  calculatorWeightInput = 500;
  calculatorAmountInput = 0;
  calculatorError = '';
  customDiscount = 0;
  cashReceived: number | null = null;
  customerName = '';
  khataCustomers: KhataCustomer[] = [];
  khataCustomerSearch = '';
  selectedKhataCustomerId: number | null = null;
  showKhataSelector = false;
  khataCustomersLoading = false;
  khataCustomerLoadError = '';
  loading = true;
  settling = false;
  loadError = '';
  settlementError = '';

  private readonly subscriptions = new Subscription();

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly khataService: KhataService
  ) {}

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
      return matchesSearch && matchesCategory && (!this.looseOnly || product.isLooseItem === true);
    });
  }

  get grossTotal(): number {
    return this.cart.reduce((total, line) => total + this.lineTotal(line), 0);
  }

  get utilityWeightKg(): number {
    if (this.utilityCalculatorMode === 'amount') {
      const amount = Number(this.utilityAmountInput);
      const pricePerKg = Number(this.utilityPricePerKg);
      return Number.isFinite(amount) && amount > 0 && Number.isFinite(pricePerKg) && pricePerKg > 0
        ? this.roundQuantity(amount / pricePerKg)
        : 0;
    }

    const weight = Number(this.utilityWeightInput);
    if (!Number.isFinite(weight) || weight <= 0) {
      return 0;
    }
    return this.utilityWeightUnit === 'g' ? weight / 1000 : weight;
  }

  get utilityItemTotal(): number {
    const pricePerKg = Number(this.utilityPricePerKg);
    if (this.utilityCalculatorMode === 'amount') {
      const amount = Number(this.utilityAmountInput);
      return Number.isFinite(amount) && amount > 0 ? this.roundCurrency(amount) : 0;
    }
    return Number.isFinite(pricePerKg) && pricePerKg > 0
      ? this.roundCurrency(this.utilityWeightKg * pricePerKg)
      : 0;
  }

  get utilityLooseCalculationIsValid(): boolean {
    const calculationInput = this.utilityCalculatorMode === 'amount'
      ? Number(this.utilityAmountInput)
      : Number(this.utilityWeightInput);
    return !!this.utilityItemName.trim()
      && this.utilityWeightKg > 0
      && Number.isFinite(calculationInput)
      && calculationInput > 0
      && Number.isFinite(Number(this.utilityPricePerKg))
      && Number(this.utilityPricePerKg) > 0;
  }

  get utilityUpiIdIsValid(): boolean {
    return /^[A-Za-z0-9._-]{2,256}@[A-Za-z0-9.-]{2,64}$/.test(this.utilityUpiId.trim());
  }

  get utilityUpiQrString(): string {
    const amount = Number(this.utilityUpiAmount);
    if (!this.utilityUpiIdIsValid || !Number.isFinite(amount) || amount <= 0) {
      return '';
    }
    return `upi://pay?pa=${encodeURIComponent(this.utilityUpiId.trim())}&pn=${encodeURIComponent(this.shopName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Payment')}`;
  }

  get calculatorQuantityKg(): number {
    if (!this.calculatorProduct) {
      return 0;
    }
    if (this.calculatorMode === 'amount') {
      const mrp = Number(this.calculatorProduct.mrp);
      return mrp > 0 ? this.roundQuantity(Number(this.calculatorAmountInput) / mrp) : 0;
    }
    const enteredWeight = Number(this.calculatorWeightInput);
    return this.roundQuantity(this.calculatorWeightUnit === 'g' ? enteredWeight / 1000 : enteredWeight);
  }

  get calculatorCharge(): number {
    if (!this.calculatorProduct) {
      return 0;
    }
    if (this.calculatorMode === 'amount') {
      return this.roundCurrency(Number(this.calculatorAmountInput));
    }
    return this.roundCurrency(this.calculatorQuantityKg * Number(this.calculatorProduct.mrp));
  }

  get calculatorRemainingStock(): number {
    if (!this.calculatorProduct) {
      return 0;
    }
    const alreadyInCart = this.cart.find((line) => line.product.id === this.calculatorProduct?.id)?.quantity ?? 0;
    return Math.max(0, Number(this.calculatorProduct.currentStock ?? 0) - alreadyInCart);
  }

  get calculatorCanAdd(): boolean {
    return !!this.calculatorProduct
      && this.calculatorQuantityKg > 0
      && this.calculatorQuantityKg <= this.calculatorRemainingStock
      && Number.isFinite(this.calculatorCharge)
      && this.calculatorCharge >= 0
      && (this.calculatorMode !== 'amount' || Number(this.calculatorProduct.mrp) > 0);
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

  selectProduct(product: Product): void {
    if (product.isLooseItem) {
      this.calculatorProduct = product;
      this.calculatorMode = 'weight';
      this.calculatorWeightUnit = 'g';
      this.calculatorWeightInput = 500;
      this.calculatorAmountInput = 0;
      this.calculatorError = '';
      this.settlementError = '';
      return;
    }
    this.addToCart(product);
  }

  setCalculatorMode(mode: 'weight' | 'amount'): void {
    if (mode === this.calculatorMode || !this.calculatorProduct) {
      return;
    }
    if (mode === 'amount') {
      this.calculatorAmountInput = this.roundCurrency(
        this.calculatorQuantityKg * Number(this.calculatorProduct.mrp)
      );
    } else {
      this.calculatorWeightUnit = 'kg';
      this.calculatorWeightInput = this.calculatorQuantityKg;
    }
    this.calculatorMode = mode;
    this.calculatorError = '';
  }

  setWeightPreset(grams: number): void {
    this.calculatorMode = 'weight';
    this.calculatorWeightUnit = 'g';
    this.calculatorWeightInput = grams;
    this.calculatorError = '';
  }

  setCalculatorWeightUnit(unit: 'g' | 'kg'): void {
    if (unit === this.calculatorWeightUnit) {
      return;
    }
    const weightKg = this.calculatorWeightUnit === 'g'
      ? Number(this.calculatorWeightInput) / 1000
      : Number(this.calculatorWeightInput);
    this.calculatorWeightUnit = unit;
    this.calculatorWeightInput = unit === 'g' ? weightKg * 1000 : weightKg;
    this.calculatorError = '';
  }

  addLooseItemToCart(): void {
    const product = this.calculatorProduct;
    if (!product) {
      return;
    }
    if (!this.calculatorCanAdd) {
      this.calculatorError = this.calculatorQuantityKg > this.calculatorRemainingStock
        ? `Only ${this.formatQuantity(this.calculatorRemainingStock)} Kg of ${product.name} is available.`
        : 'Enter a valid weight or rupee amount.';
      return;
    }

    const quantity = this.calculatorQuantityKg;
    const subtotal = this.calculatorCharge;
    const existing = this.cart.find((line) => line.product.id === product.id);
    if (existing) {
      existing.quantity = this.roundQuantity(existing.quantity + quantity);
      existing.subtotal = this.roundCurrency(this.lineTotal(existing) + subtotal);
    } else {
      this.cart = [...this.cart, {
        product,
        quantity,
        unitPrice: Number(product.mrp),
        subtotal
      }];
    }
    this.closeCalculator();
  }

  closeCalculator(): void {
    this.calculatorProduct = null;
    this.calculatorError = '';
  }

  openUtility(utility: 'loose' | 'upi'): void {
    this.activeUtility = utility;
  }

  closeUtility(): void {
    this.activeUtility = null;
  }

  removeFromCart(line: CartLine): void {
    this.cart = this.cart.filter((item) => item !== line);
  }

  lineTotal(line: CartLine): number {
    return line.subtotal ?? this.roundCurrency(line.quantity * line.unitPrice);
  }

  formatWeight(quantityKg: number): string {
    const grams = Math.round(quantityKg * 1000);
    return `${this.formatQuantity(quantityKg)} Kg (${grams}g)`;
  }

  formatQuantity(quantity: number): string {
    return Number(quantity).toFixed(3).replace(/\.?0+$/, '');
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
    this.settlementError = '';
  }

  openUpiPaymentModal(): void {
    this.settlementError = '';
    if (this.settling || this.cart.length === 0) {
      return;
    }
    if (!this.discountIsValid) {
      this.settlementError = 'Discount must be between zero and the gross total.';
      return;
    }
    if (this.netPayable <= 0) {
      this.settlementError = 'UPI payment amount must be greater than zero.';
      return;
    }

    this.upiQrString = `upi://pay?pa=${this.shopUpiId}&pn=${encodeURIComponent(this.shopName)}&am=${this.netPayable.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Kirana Bill Payment')}`;
    this.showUpiModal = true;
  }

  confirmUpiPayment(): void {
    if (!this.upiQrString || this.settling) {
      return;
    }
    this.showUpiModal = false;
    this.settle('UPI / Online');
  }

  settle(method: PaymentMethod): void {
    if (method === 'Udhar Khata') {
      this.openKhataCheckout();
      return;
    }
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
    const stockDeductions = purchasedLines.map((line) => ({
      productId: line.product.id!,
      quantity: line.quantity
    }));
    const settlement$ = this.inventoryService.deductStockBatch(stockDeductions);

    this.subscriptions.add(settlement$.subscribe({
      next: () => {
        const receipt = this.buildReceipt(purchasedLines, methodLabel);
        this.writeReceipt(receiptWindow, receipt);
        this.products = this.products.map((product) => {
          const purchased = purchasedLines.find((line) => line.product.id === product.id);
          return purchased
            ? { ...product, currentStock: this.roundQuantity(Number(product.currentStock) - purchased.quantity) }
            : product;
        });
        this.cart = [];
        this.customDiscount = 0;
        this.cashReceived = null;
        this.settling = false;
      },
      error: () => {
        receiptWindow.close();
        this.settling = false;
        this.settlementError = 'The bill could not be completed. Check inventory and khata, then try again.';
      }
    }));
  }

  get filteredKhataCustomers(): KhataCustomer[] {
    const query = this.khataCustomerSearch.trim().toLocaleLowerCase();
    return this.khataCustomers.filter((customer) =>
      !query
      || customer.customerName.toLocaleLowerCase().includes(query)
      || (customer.phoneNumber ?? '').includes(query)
    );
  }

  openKhataCheckout(): void {
    this.settlementError = '';
    if (this.settling || this.cart.length === 0) {
      return;
    }
    if (!this.discountIsValid) {
      this.settlementError = 'Discount must be between zero and the gross total.';
      return;
    }
    if (this.netPayable <= 0) {
      this.settlementError = 'A credit bill must have an amount greater than zero.';
      return;
    }
    if (this.cart.some((line) => line.product.id == null)) {
      this.settlementError = 'A product is missing its inventory ID. Reload products before billing.';
      return;
    }

    this.selectedKhataCustomerId = null;
    this.khataCustomerSearch = '';
    this.khataCustomerLoadError = '';
    this.showKhataSelector = true;
    this.khataCustomersLoading = true;
    this.khataService.getCustomers().subscribe({
      next: (customers) => {
        this.khataCustomers = customers;
        this.khataCustomersLoading = false;
      },
      error: () => {
        this.khataCustomersLoading = false;
        this.khataCustomerLoadError = 'Customer list could not be loaded. Check the connection and retry.';
      }
    });
  }

  closeKhataSelector(): void {
    if (!this.settling) {
      this.showKhataSelector = false;
      this.khataCustomerLoadError = '';
    }
  }

  confirmKhataCheckout(): void {
    const customer = this.khataCustomers.find((item) => item.id === this.selectedKhataCustomerId);
    if (!customer || this.settling) {
      this.khataCustomerLoadError = 'Select a customer before completing this credit bill.';
      return;
    }
    const receiptWindow = window.open('', '_blank', 'width=420,height=720');
    if (!receiptWindow) {
      this.khataCustomerLoadError = 'Allow pop-ups to print the receipt, then try again.';
      return;
    }

    const purchasedLines = this.cart.map((line) => ({ ...line }));
    this.customerName = customer.customerName;
    this.settling = true;
    this.khataCustomerLoadError = '';
    this.khataService.checkoutCredit({
      customerId: customer.id,
      totalAmount: this.netPayable,
      itemsSummary: purchasedLines.map((line) =>
        `${line.product.name} x ${line.product.isLooseItem ? this.formatWeight(line.quantity) : line.quantity}`
      ).join(', '),
      cartItems: purchasedLines.map((line) => ({
        productId: line.product.id!,
        quantity: line.quantity
      }))
    }).subscribe({
      next: (updatedCustomer) => {
        this.khataCustomers = this.khataCustomers.map((item) =>
          item.id === updatedCustomer.id ? updatedCustomer : item
        );
        this.writeReceipt(receiptWindow, this.buildReceipt(purchasedLines, 'Udhar Khata'));
        this.products = this.products.map((product) => {
          const purchased = purchasedLines.find((line) => line.product.id === product.id);
          return purchased
            ? { ...product, currentStock: this.roundQuantity(Number(product.currentStock) - purchased.quantity) }
            : product;
        });
        this.cart = [];
        this.customDiscount = 0;
        this.cashReceived = null;
        this.customerName = '';
        this.showKhataSelector = false;
        this.settling = false;
      },
      error: (error) => {
        receiptWindow.close();
        this.settling = false;
        const detail = error.error?.detail ?? error.error?.message;
        this.khataCustomerLoadError = typeof detail === 'string' && detail.trim()
          ? detail
          : 'Credit checkout failed. Inventory and the customer ledger were not changed.';
      }
    });
  }

  trackKhataCustomer(_: number, customer: KhataCustomer): number {
    return customer.id;
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
        <td>${this.escapeHtml(line.product.name)} × ${line.product.isLooseItem ? this.formatWeight(line.quantity) : line.quantity}</td>
        <td>${this.formatCurrency(this.lineTotal(line))}</td>
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

  private roundQuantity(value: number): number {
    return Math.round((value + Number.EPSILON) * 1000) / 1000;
  }

  private roundCurrency(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
