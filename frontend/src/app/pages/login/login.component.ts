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
  isLoggingIn = false;
  loginError = '';

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
    if (this.isLoggingIn) {
      return;
    }

    const phoneNumber = this.model.phoneNumber.trim();
    const password = this.model.password.trim();

    if (!phoneNumber || !password) {
      this.loginError = 'Phone number and password are required.';
      return;
    }

    this.isLoggingIn = true;
    this.loginError = '';
    this.inventoryService.loginUser({ phoneNumber, password }).subscribe({
      next: (response) => {
        const token = response?.token?.trim();

        if (!token) {
          localStorage.removeItem('kirana-auth-token');
          this.loginError = 'Login failed. No valid JWT token was returned by the server.';
          this.isLoggingIn = false;
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
      error: (error) => {
        localStorage.removeItem('kirana-auth-token');

        const backendMessage = error?.error?.message || error?.error?.error || 'Invalid phone number or password.';
        this.loginError = backendMessage;
        this.isLoggingIn = false;
      }
    });
  }
}
