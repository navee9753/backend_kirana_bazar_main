import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsPageComponent {
  settings = [
    { label: 'Theme', value: 'Light mode' },
    { label: 'Language', value: 'English' },
    { label: 'Low stock alert', value: '10 items' },
    { label: 'GST settings', value: 'Enabled' }
  ];
}
