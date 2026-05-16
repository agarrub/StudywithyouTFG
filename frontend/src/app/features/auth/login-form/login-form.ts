import { Component, inject, signal } from '@angular/core';
import { email, form, FormField, minLength, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { UserLogin } from '../../../core/models/user-login';

@Component({
  selector: 'app-login-form',
  imports: [FormField, RouterLink],
  templateUrl: './login-form.html',
  styleUrl: './login-form.scss',
})
export class LoginForm {
  private authService = inject(AuthService);
  private router = inject(Router);

  public isPasswordVisible = signal<boolean>(false);

  changePasswordVisibility() {
    this.isPasswordVisible.update((value) => !value);
  }

  userLoginModel = signal<UserLogin>({
    email: '',
    password: '',
  });

  userLoginForm = form(this.userLoginModel, (schema) => {
    required(schema.email, { message: 'Email is required' });
    email(schema.email, { message: 'Email is not valid' });
    required(schema.password, { message: 'Password is required' });
    minLength(schema.password, 6, { message: 'At least 6 characters' });
  });

  onSubmit($event: Event) {
    $event.preventDefault();
    const data = this.userLoginForm().value();
    this.authService.login(data).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error(error);
        alert(error.error?.message || error.message);
      },
    });
  }
}
