import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, of, switchMap, tap, throwError } from 'rxjs';
import { AuthUser } from '../models/auth-user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly user = signal<AuthUser | null>(null);
  readonly isSupport = computed(() =>
    this.user()?.roles.includes('Support') ?? false
  );

  loadUser() {
    return this.http.get<AuthUser>('/api/auth/me').pipe(
      tap(user => this.user.set(user)),
      catchError((error: HttpErrorResponse) => {
        this.user.set(null);

        if (error.status === 401) {
          return of(null);
        }

        return throwError(() => error);
      })
    );
  }

  register(email: string, password: string) {
    return this.http.post<void>(
      '/api/auth/register',
      { email, password }
    );
  }

  login(email: string, password: string) {
    return this.http.post<void>(
      '/api/auth/login?useCookies=true',
      { email, password }
    ).pipe(
      switchMap(() => this.loadUser())
    );
  }

  logout() {
    return this.http.post<void>('/api/auth/logout', {}).pipe(
      tap(() => this.user.set(null)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.user.set(null);
          return of(null);
        }

        return throwError(() => error);
      })
    );
  }
}