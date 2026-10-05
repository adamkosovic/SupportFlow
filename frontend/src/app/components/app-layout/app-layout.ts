import {
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.scss'
})
export class AppLayout {
  private readonly router = inject(Router);

  readonly authService = inject(AuthService);

  readonly loggingOut = signal(false);
  readonly logoutError = signal('');

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly isDashboard = computed(() =>
    this.currentUrl().split(/[?#]/)[0] === '/dashboard'
  );

  readonly isCreateTicket = computed(() =>
    this.currentUrl().split(/[?#]/)[0] === '/tickets/new'
  );

  readonly ticketId = computed(() => {
    const path = this.currentUrl().split(/[?#]/)[0];
    const match = path.match(/^\/tickets\/(\d+)\/?$/);

    return match?.[1] ?? null;
  });

  logout(): void {
    if (this.loggingOut()) {
      return;
    }

    this.loggingOut.set(true);
    this.logoutError.set('');

    this.authService.logout().subscribe({
      next: () => {
        this.loggingOut.set(false);
        this.router.navigate(['/login']);
      },
      error: () => {
        this.logoutError.set('Kunde inte logga ut. Försök igen.');
        this.loggingOut.set(false);
      }
    });
  }
}