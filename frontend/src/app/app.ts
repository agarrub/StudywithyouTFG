import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './features/services/auth-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private auth: AuthService = inject(AuthService);

  constructor() {
    this.auth.getUser().subscribe({
      error: () => {
        this.auth.logout();
      },
    });
  }
}
