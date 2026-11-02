import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { DashboardSummary, InventoryService, Khata, Product } from '../../services/inventory.service';
import { InactivitySessionService } from '../../services/inactivity-session.service';

interface FestivalSeason {
  name: string;
  month: number;
  day: number;
  categories: string;
  approximate: boolean;
}

interface FestivalAlert extends FestivalSeason {
  daysAway: number;
  state: 'urgent' | 'upcoming' | 'seasonal';
}

const FESTIVAL_SEASONS: FestivalSeason[] = [
  { name: 'Makar Sankranti', month: 1, day: 14, categories: 'Jaggery, sesame, ghee and festive staples', approximate: false },
  { name: 'Holi season', month: 3, day: 14, categories: 'Colours, snacks, sweets and beverages', approximate: true },
  { name: 'Baisakhi', month: 4, day: 13, categories: 'Grains, sweets and celebration essentials', approximate: false },
  { name: 'Raksha Bandhan season', month: 8, day: 15, categories: 'Sweets, dry fruits and gift essentials', approximate: true },
  { name: 'Ganesh Chaturthi season', month: 9, day: 7, categories: 'Puja essentials, sweets and offerings', approximate: true },
  { name: 'Diwali procurement season', month: 11, day: 1, categories: 'Oil, diyas, sweets, dry fruits and gift packs', approximate: true },
  { name: 'Christmas', month: 12, day: 25, categories: 'Baking supplies, chocolates and gifting', approximate: false }
];

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardPageComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  khataEntries: Khata[] = [];
  inventoryValue = 0;
  totalKhataOutstanding = 0;
  loadErrors: string[] = [];
  festivalAlert: FestivalAlert = this.getUpcomingFestival();
  remainingSeconds = 600;
  csvHeaders: string[] = [];
  csvPreview: string[][] = [];
  csvMessage = '';

  private readonly subscriptions = new Subscription();
  private csvReader?: FileReader;

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly inactivitySession: InactivitySessionService
  ) {}

  ngOnInit(): void {
    this.inactivitySession.start();
    this.subscriptions.add(
      this.inactivitySession.remainingSeconds$.subscribe((seconds) => {
        this.remainingSeconds = seconds;
      })
    );

    this.subscriptions.add(this.inventoryService.getDashboardSummary().subscribe({
      next: (summary: DashboardSummary) => {
        this.inventoryValue = summary.inventoryValue ?? 0;
        this.totalKhataOutstanding = summary.totalKhataOutstanding ?? 0;
      },
      error: () => this.loadErrors.push('Dashboard totals could not be loaded.')
    }));

    this.subscriptions.add(this.inventoryService.getProducts().subscribe({
      next: (products: Product[]) => {
        this.products = products;
      },
      error: () => this.loadErrors.push('Inventory alerts could not be loaded.')
    }));

    this.subscriptions.add(this.inventoryService.getKhata().subscribe({
      next: (entries: Khata[]) => {
        this.khataEntries = entries;
      },
      error: () => this.loadErrors.push('Khata reminders could not be loaded.')
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.csvReader?.abort();
  }

  get stats(): Array<{ label: string; value: string; tone: string }> {
    return [
      { label: 'Total Assets', value: this.formatCurrency(this.inventoryValue), tone: 'primary' },
      { label: 'Total Market Udhar', value: this.formatCurrency(this.totalKhataOutstanding), tone: 'success' },
      { label: 'Mandi Alerts', value: '0', tone: 'neutral' },
      { label: 'Out of Stock', value: String(this.outOfStockCount), tone: 'warning' }
    ];
  }

  get outOfStockCount(): number {
    return this.products.filter((product) => Number(product.currentStock) <= 0).length;
  }

  get lowStockProducts(): Product[] {
    return this.products
      .filter((product) => Number(product.currentStock) > 0 && Number(product.currentStock) <= Number(product.minStockAlert))
      .sort((first, second) => Number(first.currentStock) - Number(second.currentStock));
  }

  get activeKhataEntries(): Khata[] {
    return this.khataEntries
      .filter((entry) => Number(entry.outstandingBalance) > 0)
      .sort((first, second) => Number(second.outstandingBalance) - Number(first.outstandingBalance));
  }

  get timerLabel(): string {
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  get timerProgress(): number {
    return Math.max(0, Math.min(100, (this.remainingSeconds / 600) * 100));
  }

  whatsappLink(entry: Khata): string | null {
    const digits = (entry.phoneNumber ?? '').replace(/\D/g, '');
    const phone = digits.length === 10 ? `91${digits}` : digits;
    if (phone.length < 11 || phone.length > 15) {
      return null;
    }

    const message = `Namaste ${entry.customerName}, a friendly reminder that your khata balance is ${this.formatCurrency(entry.outstandingBalance)}. Please contact Naveen Kirana Bazar for any questions.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  onCsvSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.csvHeaders = [];
    this.csvPreview = [];
    this.csvMessage = '';
    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.csvMessage = 'Choose a .csv file to preview.';
      input.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.csvMessage = 'CSV preview is limited to files smaller than 2 MB.';
      input.value = '';
      return;
    }

    this.csvReader?.abort();
    this.csvReader = new FileReader();
    this.csvReader.onload = () => {
      try {
        const rows = this.parseCsv(String(this.csvReader?.result ?? ''));
        if (rows.length === 0) {
          this.csvMessage = 'The selected CSV has no rows to preview.';
          return;
        }
        this.csvHeaders = rows[0].map((header, index) => index === 0 ? header.replace(/^\uFEFF/, '') : header);
        this.csvPreview = rows.slice(1, 6);
        this.csvMessage = `Previewing ${Math.max(0, rows.length - 1)} data row(s). Import is not available here.`;
      } catch (error) {
        this.csvMessage = error instanceof Error ? error.message : 'The CSV file could not be read.';
      }
    };
    this.csvReader.onerror = () => {
      this.csvMessage = 'The selected CSV file could not be read.';
    };
    this.csvReader.readAsText(file);
  }

  private parseCsv(source: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let inQuotes = false;

    for (let index = 0; index < source.length; index += 1) {
      const character = source[index];
      if (character === '"') {
        if (inQuotes && source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (character === ',' && !inQuotes) {
        row.push(cell);
        cell = '';
      } else if ((character === '\n' || character === '\r') && !inQuotes) {
        row.push(cell);
        if (row.some((value) => value.length > 0)) {
          rows.push(row);
        }
        row = [];
        cell = '';
        if (character === '\r' && source[index + 1] === '\n') {
          index += 1;
        }
      } else {
        cell += character;
      }
    }

    if (inQuotes) {
      throw new Error('The CSV contains an unclosed quoted field.');
    }
    row.push(cell);
    if (row.some((value) => value.length > 0)) {
      rows.push(row);
    }
    return rows;
  }

  private getUpcomingFestival(): FestivalAlert {
    const today = new Date();
    const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const candidates = FESTIVAL_SEASONS.map((festival) => {
      const dateThisYear = Date.UTC(today.getFullYear(), festival.month - 1, festival.day);
      const date = dateThisYear >= todayUtc
        ? dateThisYear
        : Date.UTC(today.getFullYear() + 1, festival.month - 1, festival.day);
      return { festival, daysAway: Math.ceil((date - todayUtc) / 86_400_000) };
    }).sort((first, second) => first.daysAway - second.daysAway);

    const closest = candidates[0];
    return {
      ...closest.festival,
      daysAway: closest.daysAway,
      state: closest.daysAway <= 7 ? 'urgent' : closest.daysAway <= 30 ? 'upcoming' : 'seasonal'
    };
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value ?? 0);
  }
}
