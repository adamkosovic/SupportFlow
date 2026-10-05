import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { switchMap, tap } from 'rxjs';
import { AuthUser } from '../models/auth-user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly user = signal<AuthUser | null>(null);

  loadUser() {
    return this.http.get<AuthUser>('/api/auth/me').pipe(
      tap(user => this.user.set(user))
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
      tap(() => this.user.set(null))
    );
  }
}