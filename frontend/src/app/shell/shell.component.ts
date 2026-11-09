import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.css']
})
export class ShellComponent {
  navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '▣' },
    { label: 'Inventory', path: '/inventory', icon: '▤' },
    { label: 'Scan', path: '/scan-inspect', icon: '⌗' },
    { label: 'Khata', path: '/khata', icon: '◫' },
    { label: 'Billing', path: '/billing', icon: '◌' },
    { label: 'Suppliers', path: '/suppliers', icon: '◍' },
    { label: 'Settings', path: '/settings', icon: '⚙' }
  ];

  constructor(private router: Router) {}

  logout(): void {
    localStorage.removeItem('kirana-auth-token');
    localStorage.removeItem('kirana-user-role');
    localStorage.removeItem('kirana-user-phone');
    this.router.navigateByUrl('/login');
  }
}
