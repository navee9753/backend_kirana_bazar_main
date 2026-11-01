import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginPageComponent {
  model = {
    phoneNumber: '',
    password: '',
    role: 'ADMIN' as 'ADMIN' | 'WORKER'
  };

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly router: Router
  ) {}

  onSubmit(): void {
    const phoneNumber = this.model.phoneNumber.trim();
    const password = this.model.password.trim();

    if (!phoneNumber || !password) {
      alert('Phone number and password are required.');
      return;
    }

    this.inventoryService.loginUser({ phoneNumber, password }).subscribe({
      next: (response) => {
        const token = response?.token?.trim();

        if (!token) {
          localStorage.removeItem('kirana-auth-token');
          alert('Login failed. No valid JWT token was returned by the server.');
          return;
        }

        const normalizedRole = (response.role || this.model.role)
          .toString()
          .toUpperCase()
          .replace('ROLE_', '') as 'ADMIN' | 'WORKER';

        localStorage.setItem('kirana-user-role', normalizedRole);
        localStorage.setItem('kirana-user-phone', response.phoneNumber || phoneNumber);
        localStorage.setItem('kirana-auth-token', token);

        this.router.navigateByUrl('/dashboard');
      },
      error: () => {
        localStorage.removeItem('kirana-auth-token');
        alert('Login failed. Please check your credentials and try again.');
      }
    });
  }
}
