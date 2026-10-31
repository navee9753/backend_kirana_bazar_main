import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { LoginPageComponent } from './pages/login/login.component';
import { DashboardPageComponent } from './pages/dashboard/dashboard.component';
import { InventoryPageComponent } from './pages/inventory/inventory.component';
import { ProductFormPageComponent } from './pages/inventory/product-form.component';
import { KhataPageComponent } from './pages/khata/khata.component';
import { BillingPageComponent } from './pages/billing/billing.component';
import { SettingsPageComponent } from './pages/settings/settings.component';
import { ShellComponent } from './shell/shell.component';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardPageComponent },
      { path: 'inventory', component: InventoryPageComponent },
      { path: 'inventory/new', component: ProductFormPageComponent },
      { path: 'khata', component: KhataPageComponent },
      { path: 'billing', component: BillingPageComponent },
      { path: 'settings', component: SettingsPageComponent }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
