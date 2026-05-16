import { Component, inject, signal } from '@angular/core';
import { form, FormField, required, email, minLength, maxLength } from '@angular/forms/signals';
import { UserRegister } from '../../../core/models/user-register';
import { AuthService } from '../../services/auth-service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register-form',
  imports: [FormField, RouterLink],
  templateUrl: './register-form.html',
  styleUrl: './register-form.scss',
})
export class RegisterForm {
  private authService = inject(AuthService);
  private router = inject(Router);

  public avatarPreview = signal<string | null>(null);
  public isPasswordShown = signal<boolean>(false);
  public isConfirmPasswordShown = signal<boolean>(false);

  userRegisterModel = signal<UserRegister>({
    name: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    birthDate: '',
    avatar: '',
  });

  userRegisterForm = form(this.userRegisterModel, (schema) => {
    required(schema.name, { message: 'Name is required' });
    minLength(schema.name, 3, { message: 'At least 3 characters' });
    maxLength(schema.name, 20, { message: 'Max 20 characters' });
    required(schema.email, { message: 'Email is required' });
    email(schema.email, { message: 'Email is not valid' });
    required(schema.password, { message: 'Password is required' });
    minLength(schema.password, 6, { message: 'At least 6 characters' });
    required(schema.birthDate, { message: 'Birth date is required' });
  });

  public avatarFile = signal<File | null>(null);
  public avatarError: string = '';

  private readonly maxFileSize = 2 * 1024 * 1024;
  private readonly allowedFileTypes = ['image/jpeg', 'image/png', 'image/webp'];

  onAvatarChange($event: Event) {
    const input = $event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      if (!this.allowedFileTypes.includes(file.type)) {
        this.avatarError = 'Tipo de formato de archivo inválido.';
        return;
      } else {
        if (file.size > this.maxFileSize) {
          this.avatarError = 'El archivo excede el tamaño máximo permitido.';
          return;
        } else {
          this.avatarFile.set(file);
          this.avatarError = '';
        }
      }
    } else {
      this.avatarError = 'No se seleccionó ningún archivo.';
      return;
    }
  }

  onSubmit($event: Event) {
    $event.preventDefault();

    const formData = new FormData();
    const data = this.userRegisterForm().value();
    const avatar = this.avatarFile();

    (Object.keys(data) as Array<keyof UserRegister>)
      .filter((key) => key !== 'avatar')
      .forEach((key) => formData.append(key, String(data[key])));

    if (avatar) {
      formData.append('avatar', avatar, avatar.name);
    }

    this.authService.register(formData).subscribe({
      next: () => {
        this.router.navigate(['/register-executed']);
      },
      error: (error) => {
        console.error(error);
        alert(error.error?.message || error.message);
      },
    });
  }
}
