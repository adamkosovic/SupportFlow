import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private readonly route = inject(ActivatedRoute);

  readonly sessionExpired =
    this.route.snapshot.queryParamMap.get('sessionExpired') === 'true';

  email = '';
  password = '';

  readonly saving = signal(false);
  readonly error = signal('');

  submit(): void {
    if (this.saving()) {
      return;
    }

    const email = this.email.trim();

    if (!email || !this.password) {
      this.error.set('Fyll i e-post och lösenord.');
      return;
    }

    this.error.set('');
    this.saving.set(true);

    this.authService.login(email, this.password).subscribe({
      next: () => {
        this.password = '';
        this.saving.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(
          error.status === 401
            ? 'Fel e-post eller lösenord.'
            : 'Kunde inte logga in. Kontrollera att API:et körs.'
        );

        this.saving.set(false);
      }
    });
  }
}