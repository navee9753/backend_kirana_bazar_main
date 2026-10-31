import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { InventoryService, Product } from '../../services/inventory.service';

@Component({
  selector: 'app-inventory-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class InventoryPageComponent implements OnInit {
  inventory: Array<{ name: string; brand: string; stock: number; min: number; purchase: number; mrp: number }> = [];

  constructor(private readonly inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.inventoryService.getProducts().subscribe({
      next: (products: Product[]) => {
        this.inventory = products.map((product) => ({
          name: product.name,
          brand: product.brand,
          stock: Number(product.currentStock ?? 0),
          min: Number(product.minStockAlert ?? 0),
          purchase: Number(product.purchasePrice ?? 0),
          mrp: Number(product.mrp ?? 0)
        }));
      },
      error: () => {
        this.inventory = [];
      }
    });
  }
}
