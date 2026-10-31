import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { InventoryService, Product } from '../../services/inventory.service';

@Component({
  selector: 'app-product-form-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormPageComponent {
  model = {
    name: '',
    brand: '',
    category: 'Groceries',
    unit: 'kg',
    currentStock: 0,
    minStockAlert: 10,
    costPrice: 0,
    mrp: 0,
    salePrice: 0,
    sku: '',
    hsn: ''
  };

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly router: Router
  ) {}

  get marginPercent(): number {
    if (!this.model.salePrice || !this.model.costPrice) {
      return 0;
    }

    return ((this.model.salePrice - this.model.costPrice) / this.model.costPrice) * 100;
  }

  onSubmit(): void {
    if (!this.model.name.trim() || !this.model.brand.trim()) {
      alert('Product name and brand are required.');
      return;
    }

    const product: Product = {
      name: this.model.name.trim(),
      brand: this.model.brand.trim(),
      category: this.model.category.trim() || 'Groceries',
      currentStock: Number(this.model.currentStock ?? 0),
      minStockAlert: Number(this.model.minStockAlert ?? 0),
      purchasePrice: Number(this.model.costPrice ?? 0),
      mrp: Number(this.model.mrp ?? 0),
      salePrice: Number(this.model.salePrice ?? this.model.mrp ?? 0),
      unit: this.model.unit,
      sku: this.model.sku.trim(),
      hsn: this.model.hsn.trim()
    };

    this.inventoryService.addProduct(product).subscribe({
      next: () => {
        this.router.navigateByUrl('/inventory');
      },
      error: () => {
        this.router.navigateByUrl('/inventory');
      }
    });
  }
}
