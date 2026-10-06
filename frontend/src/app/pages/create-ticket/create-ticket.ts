import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { TicketForm } from '../../components/ticket-form/ticket-form';
import { TicketService } from '../../services/ticket.service';

@Component({
  selector: 'app-create-ticket',
  imports: [RouterLink, TicketForm],
  templateUrl: './create-ticket.html',
  styleUrl: './create-ticket.scss'
})
export class CreateTicket {
  private readonly ticketService = inject(TicketService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly saving = signal(false);
  readonly error = signal('');

  createTicket(request: {
    title: string;
    description: string;
    priority: string;
  }): void {
    if (this.saving()) {
      return;
    }

    this.error.set('');
    this.saving.set(true);

    this.ticketService
      .createTicket(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ticket => {
          void this.router.navigate(['/tickets', ticket.id]);
        },
        error: (error: HttpErrorResponse) => {
          this.error.set(this.getErrorMessage(error));
          this.saving.set(false);
        }
      });
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 400) {
      const body = error.error;

      if (body && typeof body === 'object') {
        const validationErrors = body.errors;

        if (
          validationErrors &&
          typeof validationErrors === 'object'
        ) {
          const messages = Object.values(validationErrors)
            .flatMap(value => Array.isArray(value) ? value : [])
            .filter(
              (value): value is string => typeof value === 'string'
            );

          if (messages.length > 0) {
            return [...new Set(messages)].join(' ');
          }
        }

        if (typeof body.message === 'string') {
          return body.message;
        }
      }

      if (typeof body === 'string' && body.trim()) {
        return body;
      }

      return 'Kontrollera att alla fält är korrekt ifyllda.';
    }

    if (error.status === 0) {
      return 'Kunde inte kontakta servern. Kontrollera att API:et körs.';
    }

    if (error.status === 401) {
      return 'Du behöver logga in igen.';
    }

    if (error.status === 403) {
      return 'Du saknar behörighet att skapa ärendet.';
    }

    return 'Kunde inte skapa ärendet. Försök igen senare.';
  }
}