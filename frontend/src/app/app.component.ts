import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private readonly themeStorageKey = 'kirana-theme';
  isDarkMode = localStorage.getItem(this.themeStorageKey) === 'dark';

  constructor() {
    this.applyTheme();
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem(this.themeStorageKey, this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    const root = document.documentElement;
    root.classList.toggle('dark', this.isDarkMode);
    root.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
  }
}
