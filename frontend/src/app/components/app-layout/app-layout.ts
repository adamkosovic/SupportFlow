import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-layout',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.scss'
})
export class AppLayout {
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly isDashboard = computed(() => {
    const path = this.currentUrl().split(/[?#]/)[0];

    return path === '/dashboard';
  });

  readonly isCreateTicket = computed(() =>
    this.currentUrl().split(/[?#]/)[0] === '/tickets/new'
  );

  readonly ticketId = computed(() => {
    const path = this.currentUrl().split(/[?#]/)[0];
    const match = path.match(/^\/tickets\/(\d+)\/?$/);

    return match?.[1] ?? null;
  });
}