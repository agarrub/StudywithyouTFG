import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { UserLogin } from '../../core/models/user-login';
import { UserInfo } from '../../core/models/user-info';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly url: string = environment.apiUrl;

  public http: HttpClient = inject(HttpClient);

  public user = signal<UserInfo | null>(null);

  public readonly register = (data: FormData): Observable<void> => {
    return this.http.post<void>(`${this.url}/auth/register`, data, { withCredentials: true });
  };

  public readonly login = (user: UserLogin): Observable<UserLogin> => {
    return this.http
      .post<UserLogin>(`${this.url}/auth/login`, user, { withCredentials: true })
      .pipe(
        tap(() => {
          this.getUser().subscribe();
        }),
      );
  };

  public readonly getUser = (): Observable<UserInfo> => {
    return this.http
      .get<{ message: string; user: UserInfo }>(`${this.url}/auth/user`, { withCredentials: true })
      .pipe(tap((response) => this.user.set(response.user))) as any;
  };

  public readonly logout = (): Observable<void> => {
    return this.http
      .post<void>(`${this.url}/auth/logout`, {}, { withCredentials: true })
      .pipe(tap(() => this.user.set(null)));
  };

  public readonly forgotPassword = (email: string): Observable<void> => {
    return this.http.post<void>(
      `${this.url}/auth/forgot-password`,
      { email },
      { withCredentials: true },
    );
  };

  public readonly resetPassword = (token: string, password: string): Observable<void> => {
    return this.http.post<void>(
      `${this.url}/auth/reset-password/${token}`,
      { password },
      { withCredentials: true },
    );
  };

  public readonly delete = (id: string): Observable<void> => {
    return this.http.delete<void>(`${this.url}/auth/delete/${id}`, { withCredentials: true });
  };

  public readonly update = (data: FormData): Observable<void> => {
    return this.http.put<void>(`${this.url}/auth/update`, data, { withCredentials: true }).pipe(
      tap(() => {
        this.getUser().subscribe();
      }),
    );
  };
}
