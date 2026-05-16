import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';

@Component({
  selector: 'app-navigation-header',
  imports: [RouterLink],
  templateUrl: './navigation-header.html',
  styleUrl: './navigation-header.scss',
})
export class NavigationHeader {
  private auth: AuthService = inject(AuthService);
  private router = inject(Router);

  public user = this.auth.user;

  public isShown = signal<boolean>(false);
  
  toggleUserOptions() {
    this.isShown.update((v) => !v);
  }

  logout() {
    this.auth.logout().subscribe({
      next: () => {
        this.isShown.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => console.error('Error cerrando sesión', err),
    });
  }
}
