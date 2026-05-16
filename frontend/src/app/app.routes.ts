import { RegisterForm } from './features/auth/register-form/register-form';
import { Routes } from '@angular/router';
import { ComponentLayout } from './features/component-layout/component-layout';
import { Home } from './features/home/home';
import { UserSettings } from './features/user-settings/user-settings';
import { RegisterExecuted } from './features/auth/register-executed/register-executed';
import { LoginForm } from './features/auth/login-form/login-form';
import { ResetExecuted } from './features/auth/reset-executed/reset-executed';
import { EmailToReset } from './features/auth/email-to-reset/email-to-reset';
import { ResetForm } from './features/auth/reset-form/reset-form';
import { PasswordChanged } from './features/auth/password-changed/password-changed';
import { Notes } from './features/notes/notes';
import { Pomodoro } from './features/pomodoro/pomodoro';
import { ToDoList } from './features/to-do-list/to-do-list';
import { unsavedChangesGuard } from './core/guards/unsaved-changes';

export const routes: Routes = [
  {
    path: '',
    component: ComponentLayout,
    children: [
      {
        path: '',
        component: Home,
      },
    ],
  },
  {
    path: 'settings',
    component: UserSettings,
  },
  {
    path: 'register',
    component: RegisterForm,
  },
  {
    path: 'register-executed',
    component: RegisterExecuted,
  },
  {
    path: 'login',
    component: LoginForm,
  },
  {
    path: 'email-to-reset',
    component: EmailToReset,
  },
  {
    path: 'reset-form',
    component: ResetForm,
  },
  {
    path: 'reset-executed',
    component: ResetExecuted,
  },
  {
    path: 'reset-form',
    component: ResetForm,
  },
  {
    path: 'password-changed',
    component: PasswordChanged,
  },
  {
    path: 'notes',
    component: Notes,
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'pomodoro',
    component: Pomodoro,
  },
  {
    path: 'todo',
    component: ToDoList,
  },
];
