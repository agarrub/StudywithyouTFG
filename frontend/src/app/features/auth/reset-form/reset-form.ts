import { Component, inject, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-reset-form',
  imports: [FormField],
  templateUrl: './reset-form.html',
  styleUrl: './reset-form.scss',
})
export class ResetForm {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  userResetPasswordModel = signal<{ password: ''; confirmPassword: '' }>;

  userResetPasswordForm = form(
    this.userResetPasswordModel({ password: '', confirmPassword: '' }),
    (schema) => {
      required(schema.password, { message: 'Password is required' });
      required(schema.confirmPassword, { message: 'Confirm password is required' });
    },
  );

  onSubmit($event: Event) {
    $event.preventDefault();

    const data = this.userResetPasswordForm().value();
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      alert('Token is missing or invalid');
      return;
    }

    this.auth.resetPassword(token, data.password).subscribe({
      next: () => {
        this.router.navigate(['/password-changed']);
      },
      error: (error) => {
        alert(error.message);
      },
    });
  }
}
