import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { AppLayout } from './components/app-layout/app-layout';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppLayout],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly router = inject(Router);

  readonly isAuthPage = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.isAuthUrl(this.router.url)),
      startWith(this.isAuthUrl(this.router.url))
    ),
    { initialValue: false }
  );

  private isAuthUrl(url: string): boolean {
    const path = url.split(/[?#]/)[0];

    return path === '/login' || path === '/register';
  }
}