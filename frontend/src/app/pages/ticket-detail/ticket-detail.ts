import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { TicketComments } from '../../components/ticket-comments/ticket-comments';
import { SupportTicket } from '../../models/support-ticket';
import { TicketService } from '../../services/ticket.service';

@Component({
  selector: 'app-ticket-detail',
  imports: [DatePipe, RouterLink, TicketComments],
  templateUrl: './ticket-detail.html',
  styleUrl: './ticket-detail.scss'
})
export class TicketDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly ticketService = inject(TicketService);

  readonly ticket = signal<SupportTicket | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly saving = signal(false);
  readonly statusError = signal('');

  constructor() {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.loading.set(true);
        this.error.set('');
        this.ticket.set(null);

        const id = Number(params.get('id'));

        if (!Number.isSafeInteger(id) || id <= 0) {
          this.error.set('Ogiltigt ärendenummer.');
          return of(null);
        }

        return this.ticketService.getTicket(id).pipe(
          catchError((error: HttpErrorResponse) => {
            this.error.set(
              error.status === 404
                ? 'Ärendet finns inte.'
                : 'Kunde inte hämta ärendet. Försök igen senare.'
            );

            return of(null);
          })
        );
      }),
      takeUntilDestroyed()
    ).subscribe(ticket => {
      this.ticket.set(ticket);
      this.loading.set(false);
    });
  }

  updateStatus(status: string): void {
    const currentTicket = this.ticket();
  
    if (
      !currentTicket ||
      this.saving() ||
      currentTicket.status === status
    ) {
      return;
    }
  
    this.statusError.set('');
    this.saving.set(true);
  
    this.ticketService.updateStatus(currentTicket.id, status).subscribe({
      next: updatedTicket => {
        // Uppdatera bara om samma ärende fortfarande visas.
        if (this.ticket()?.id === updatedTicket.id) {
          this.ticket.set(updatedTicket);
        }
  
        this.saving.set(false);
      },
      error: () => {
        this.statusError.set('Kunde inte ändra status. Försök igen.');
        this.saving.set(false);
      }
    });
  }
}