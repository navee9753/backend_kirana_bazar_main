import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner';

import { InventoryService, Product } from '../services/inventory.service';

@Component({
  selector: 'app-scan-inspect',
  standalone: true,
  imports: [CommonModule, FormsModule, ZXingScannerModule],
  templateUrl: './scan-inspect.component.html',
  styleUrls: ['./scan-inspect.component.css']
})
export class ScanInspectComponent implements OnInit {
  scannedBarcode = '';
  matchedProduct: Product | null = null;
  hasCameras = false;
  scannerEnabled = true;
  products: Product[] = [];
  manualBarcode = '';
  barcodeNotice = '';
  cameraPermissionDenied = false;
  productsLoading = true;
  productsError = '';

  constructor(private readonly inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.inventoryService.getProducts().subscribe({
      next: (products) => {
        this.products = products ?? [];
        this.productsLoading = false;
      },
      error: () => {
        this.productsLoading = false;
        this.productsError = 'Inventory could not be loaded. Please reload and try again.';
      }
    });
  }

  onScanSuccess(barcode: string): void {
    const value = barcode.trim();
    if (!value || value === this.scannedBarcode) {
      return;
    }

    this.playBeep();
    this.scannedBarcode = value;
    this.matchedProduct = this.products.find(product =>
      this.normalizeBarcode(product.barcode) === this.normalizeBarcode(value) ||
      this.normalizeBarcode(product.sku) === this.normalizeBarcode(value)
    ) ?? null;
    this.barcodeNotice = '';
    this.scannerEnabled = false;
  }

  onCamerasFound(cameras: MediaDeviceInfo[]): void {
    this.hasCameras = cameras.length > 0;
  }

  onPermissionResponse(granted: boolean): void {
    this.cameraPermissionDenied = !granted;
  }

  scanManualBarcode(): void {
    if (!this.manualBarcode.trim()) {
      return;
    }
    this.onScanSuccess(this.manualBarcode);
    this.manualBarcode = '';
  }

  resumeScanning(): void {
    this.scannedBarcode = '';
    this.matchedProduct = null;
    this.barcodeNotice = '';
    this.scannerEnabled = true;
  }

  notifyAddBarcode(): void {
    this.barcodeNotice = `Barcode ${this.scannedBarcode} is not linked to an inventory item. Add it to the item's barcode or SKU and scan again.`;
  }

  get isLowStock(): boolean {
    return !!this.matchedProduct &&
      Number(this.matchedProduct.currentStock) <= Number(this.matchedProduct.minStockAlert);
  }

  get shelfValue(): number {
    if (!this.matchedProduct) {
      return 0;
    }
    return Number(this.matchedProduct.currentStock ?? 0) * Number(this.matchedProduct.purchasePrice ?? 0);
  }

  private normalizeBarcode(value: string | undefined): string {
    return (value ?? '').trim().toLowerCase();
  }

  private playBeep(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) {
      return;
    }

    try {
      const context = new AudioContextConstructor();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.13);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.14);
      oscillator.addEventListener('ended', () => void context.close(), { once: true });
    } catch {
      // Camera scanning remains usable if the browser blocks audio playback.
    }
  }
}
