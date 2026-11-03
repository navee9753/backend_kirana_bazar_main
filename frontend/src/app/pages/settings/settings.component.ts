import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsPageComponent {
  readonly storeName = 'NAVEEN KIRANA BAZAR';
  readonly tagline = 'Serving our neighborhood with trust, freshness, and quality daily necessities since 2010.';
  readonly overview = 'Naveen Kirana Bazar is a modern, technology-enabled retail grocery hub. We balance bulk staples distribution with fast, friendly customer counter checkout and digital credit tracking through our Khata management.';
  readonly operationalHighlights = [
    '100% Secure Digitized Udhar Khata Tracking',
    'Predictive Cultural & Festival Stock Allocation Planning',
    'Bulk Spreadsheet Catalog Import & Data Backups',
    'Instant Multi-Mode Counter Billing & Invoicing Engine'
  ];
  readonly contactDetails = [
    { icon: '⌖', label: 'Physical Address', value: 'Maliya road Village-Bamniya.' },
    { icon: '◷', label: 'Operating Hours', value: 'Monday – Sunday: 7:00 AM – 10:00 PM' },
    { icon: '☎', label: 'Support Hotlines', value: '+91 9753633797 / +91 9425974263' },
    { icon: '✉', label: 'Official Email', value: 'nks.test@gmail.com' }
  ];

  constructor(private router: Router) {}

  logout(): void {
    localStorage.removeItem('kirana-auth-token');
    localStorage.removeItem('kirana-user-role');
    localStorage.removeItem('kirana-user-phone');
    this.router.navigateByUrl('/login');
  }
}
