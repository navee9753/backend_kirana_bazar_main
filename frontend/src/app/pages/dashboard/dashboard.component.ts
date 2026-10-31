import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { DashboardSummary, InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardPageComponent implements OnInit {
  stats: Array<{ label: string; value: string; tone: string }> = [];

  tasks = [
    'Review stockouts before the evening rush.',
    'Confirm festival demand list with the floor team.',
    'Follow up on outstanding khata balances over ₹5,000.'
  ];

  constructor(private readonly inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.inventoryService.getDashboardSummary().subscribe({
      next: (summary: DashboardSummary) => {
        this.stats = [
          { label: 'Inventory value', value: this.formatCurrency(summary.inventoryValue), tone: 'primary' },
          { label: 'Low stock', value: String(summary.lowStockCount ?? 0), tone: 'warning' },
          { label: 'Khata due', value: this.formatCurrency(summary.totalKhataOutstanding), tone: 'success' },
          { label: 'Total products', value: String(summary.totalProducts ?? 0), tone: 'neutral' }
        ];
      },
      error: () => {
        this.stats = [
          { label: 'Inventory value', value: '₹0', tone: 'primary' },
          { label: 'Low stock', value: '0', tone: 'warning' },
          { label: 'Khata due', value: '₹0', tone: 'success' },
          { label: 'Total products', value: '0', tone: 'neutral' }
        ];
      }
    });
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value ?? 0);
  }
}
