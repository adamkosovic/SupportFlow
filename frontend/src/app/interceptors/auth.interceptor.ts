import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';
import { inject, Injector} from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);

  // Hämta tjänsten först när ett fel behöver hanteras.
  const injector = inject(Injector);

  const path = request.url.split(/[?#]/)[0];

  const isProtectedApi =
    path.startsWith('/api/') &&
    !path.startsWith('/api/auth/');

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && isProtectedApi) {
        const authService = injector.get(AuthService);
        authService.user.set(null);

        const currentPath = router.url.split(/[?#]/)[0];

        if (currentPath !== '/login' && currentPath !== '/register') {
          void router.navigate(['/login'], {
            queryParams: { sessionExpired: 'true' }
          });
        }
      }

      return throwError(() => error);
    })
  );
};