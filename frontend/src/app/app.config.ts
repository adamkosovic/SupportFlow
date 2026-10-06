import {
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { catchError, firstValueFrom, of } from 'rxjs';

import { routes } from './app.routes';
import { AuthService } from './services/auth.service';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),

    provideAppInitializer(() => {
      const authService = inject(AuthService);

      return firstValueFrom(
        authService.loadUser().pipe(
          catchError(() => of(null))
        )
      );
    })
  ]
};