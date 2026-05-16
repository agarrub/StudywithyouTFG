import { Component, inject, signal, effect } from '@angular/core';
import { form, FormField, required, email, minLength, maxLength } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { UserRegister } from '../../core/models/user-register';

@Component({
  selector: 'app-user-settings',
  imports: [FormField],
  templateUrl: './user-settings.html',
  styleUrl: './user-settings.scss',
})
export class UserSettings {
  private authService = inject(AuthService);
  private router = inject(Router);

  public readonly user = this.authService.user;

  userChangeDataModel = signal<UserRegister>({
    name: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '' as any,
    birthDate: '',
    avatar: '',
  });

  userChangeDataForm = form(this.userChangeDataModel, (schema) => {
    required(schema.name, { message: 'El nombre es obligatorio' });
    minLength(schema.name, 3, { message: 'Mínimo 3 caracteres' });
    maxLength(schema.name, 20, { message: 'Máximo 20 caracteres' });
    required(schema.email, { message: 'El correo es obligatorio' });
    email(schema.email, { message: 'El correo no es válido' });
    required(schema.gender, { message: 'El género es obligatorio' });
  });

  constructor() {
    effect(
      () => {
        const user = this.user();
        if (user) {
          let birthDate = '';
          if (user.birthDate) {
            try {
              birthDate = String(user.birthDate).substring(0, 10);
            } catch {
              birthDate = '';
            }
          }
          this.userChangeDataModel.set({
            name: user.name || '',
            lastName: user.lastName || '',
            email: user.email || '',
            password: '',
            confirmPassword: '',
            gender: (user.gender as any) || ('' as any),
            birthDate: birthDate,
            avatar: user.avatar || '',
          });
        }
      },
    );
  }

  private avatarFile = signal<File | null>(null);
  public avatarError: string = '';
  public avatarPreviewUrl = signal<string | null>(null);

  private readonly maxFileSize = 2 * 1024 * 1024;
  private readonly allowedFileTypes = ['image/jpeg', 'image/png', 'image/webp'];

  get displayAvatar(): string {
    return this.avatarPreviewUrl() || this.user()?.avatar || '/HeaderImg/user.png';
  }

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
          this.avatarPreviewUrl.set(URL.createObjectURL(file));
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
    const data = this.userChangeDataForm().value();
    const avatar = this.avatarFile();

    (Object.keys(data) as Array<keyof UserRegister>)
      .filter((key) => key !== 'avatar')
      .forEach((key) => formData.append(key, String(data[key])));

    if (avatar) {
      formData.append('avatar', avatar, avatar.name);
    }

    this.authService.update(formData).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error(error);
        alert(error.error?.message || error.message);
      },
    });
  }

  cancelUpdate() {
    this.router.navigate(['/']);
  }
}
