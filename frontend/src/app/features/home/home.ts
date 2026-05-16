import { Component, inject, signal } from '@angular/core';
import { CalendarWidget } from '../calendar-widget/calendar-widget';
import { AuthService } from '../services/auth-service';
@Component({
  selector: 'app-home',
  imports: [CalendarWidget],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  public readonly authService: AuthService = inject(AuthService);
  public footerYear = signal<number>(new Date().getFullYear());
  public user = this.authService.user();
}
