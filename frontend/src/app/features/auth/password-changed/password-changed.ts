import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-password-changed',
  imports: [],
  templateUrl: './password-changed.html',
  styleUrl: './password-changed.scss',
})
export class PasswordChanged {

  private router = inject(Router);

  constructor() {
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 3000);
  }
}
