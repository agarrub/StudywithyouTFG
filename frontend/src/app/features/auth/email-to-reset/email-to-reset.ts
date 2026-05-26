import { Component, inject, signal } from '@angular/core';
import { email, form, FormField, required } from '@angular/forms/signals';
import { AuthService } from '../../services/auth-service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-email-to-reset',
  imports: [FormField, RouterLink],
  templateUrl: './email-to-reset.html',
  styleUrl: './email-to-reset.scss',
})
export class EmailToReset {
  private auth = inject(AuthService);
  private router = inject(Router);

  emailToResetModel = signal<{ email: '' }>;

  emailToResetForm = form(this.emailToResetModel({ email: '' }), (schema) => {
    required(schema.email, { message: 'Email is required' });
    email(schema.email, { message: 'Email is not valid' });
  });

  onSubmit($event: Event) {
    $event.preventDefault();

    const data = this.emailToResetForm().value();

    this.auth.forgotPassword(data.email).subscribe({
      next: () => {
        this.router.navigate(['/reset-executed']);
      },
      error: (error) => {
        alert(error.message);
      },
    });
  }
}
