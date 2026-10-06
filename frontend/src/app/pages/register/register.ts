import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  email = '';
  password = '';
  confirmPassword = '';

  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal(false);

  submit(form: NgForm): void {
    if (this.saving()) {
      return;
    }

    this.error.set('');

    const email = this.email.trim();

    if (form.invalid || !email) {
      this.error.set('Fyll i en giltig e-postadress och alla lösenordsfält.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error.set('Lösenorden stämmer inte överens.');
      return;
    }

    const validPassword =
      this.password.length >= 8 &&
      /[a-z]/.test(this.password) &&
      /[A-Z]/.test(this.password) &&
      /[0-9]/.test(this.password) &&
      /[^a-zA-Z0-9]/.test(this.password);

    if (!validPassword) {
      this.error.set(
        'Lösenordet måste ha minst 8 tecken, stor och liten bokstav, siffra och specialtecken.'
      );
      return;
    }

    this.saving.set(true);

    this.authService
      .register(email, this.password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          form.resetForm();
          this.password = '';
          this.confirmPassword = '';
          this.saving.set(false);
          this.success.set(true);
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);

          this.error.set(
            error.status === 400
              ? 'Kunde inte skapa kontot. E-postadressen kan redan vara registrerad eller lösenordet uppfyller inte kraven.'
              : 'Kunde inte kontakta servern. Försök igen senare.'
          );
        }
      });
  }
}