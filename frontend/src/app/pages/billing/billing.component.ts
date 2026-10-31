import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-billing-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.css']
})
export class BillingPageComponent {
  catalog = [
    { name: 'Aashirvaad Atta', qty: 5, price: 300 },
    { name: 'Fortune Oil', qty: 3, price: 680 },
    { name: 'Tata Salt', qty: 9, price: 120 },
    { name: 'Rice 10kg', qty: 4, price: 540 },
    { name: 'Tea Leaves', qty: 6, price: 260 }
  ];

  cart = [
    { name: 'Aashirvaad Atta', qty: 2, price: 300 },
    { name: 'Fortune Oil', qty: 1, price: 680 }
  ];

  get subtotal(): number {
    return this.cart.reduce((total, item) => total + item.qty * item.price, 0);
  }

  get total(): number {
    return this.subtotal;
  }
}
