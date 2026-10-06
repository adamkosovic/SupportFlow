import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';

import { TicketComments } from '../../components/ticket-comments/ticket-comments';
import { TicketAssignment } from '../../components/ticket-assignment/ticket-assignment';
import { TicketHistory } from '../../components/ticket-history/ticket-history';
import { SupportTicket } from '../../models/support-ticket';
import { TicketService } from '../../services/ticket.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-ticket-detail',
  imports: [
    DatePipe,
    RouterLink,
    TicketComments,
    TicketAssignment,
    TicketHistory
  ],
  templateUrl: './ticket-detail.html',
  styleUrl: './ticket-detail.scss'
})
export class TicketDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly ticketService = inject(TicketService);
  private readonly destroyRef = inject(DestroyRef);

  readonly authService = inject(AuthService);

  readonly ticket = signal<SupportTicket | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly saving = signal(false);
  readonly statusError = signal('');

  readonly savingPriority = signal(false);
  readonly priorityError = signal('');

  readonly historyRefreshKey = signal(0);

  // Hjälper oss att ignorera svar från en tidigare ärendesida.
  private routeVersion = 0;

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap(params => {
          this.routeVersion++;

          this.loading.set(true);
          this.error.set('');
          this.ticket.set(null);
          this.saving.set(false);
          this.savingPriority.set(false);
          this.statusError.set('');
          this.priorityError.set('');
          this.historyRefreshKey.set(0);

          const id = Number(params.get('id'));

          if (!Number.isSafeInteger(id) || id <= 0) {
            this.error.set('Ogiltigt ärendenummer.');
            return of(null);
          }

          return this.ticketService.getTicket(id).pipe(
            catchError((error: HttpErrorResponse) => {
              this.error.set(
                error.status === 404
                  ? 'Ärendet finns inte eller du saknar åtkomst.'
                  : 'Kunde inte hämta ärendet. Försök igen senare.'
              );

              return of(null);
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(ticket => {
        this.ticket.set(ticket);
        this.loading.set(false);
      });
  }

  updateStatus(status: string): void {
    const currentTicket = this.ticket();

    if (
      !currentTicket ||
      !this.authService.isSupport() ||
      this.saving() ||
      this.savingPriority() ||
      currentTicket.status === status
    ) {
      return;
    }

    const routeVersion = this.routeVersion;

    this.statusError.set('');
    this.saving.set(true);

    this.ticketService
      .updateStatus(currentTicket.id, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updatedTicket => {
          if (routeVersion !== this.routeVersion) {
            return;
          }

          if (this.ticket()?.id === updatedTicket.id) {
            this.ticket.set(updatedTicket);
            this.historyRefreshKey.update(value => value + 1);
          }

          this.saving.set(false);
        },
        error: () => {
          if (routeVersion !== this.routeVersion) {
            return;
          }

          this.statusError.set('Kunde inte ändra status. Försök igen.');
          this.saving.set(false);
        }
      });
  }

  updatePriority(priority: string): void {
    const currentTicket = this.ticket();

    if (
      !currentTicket ||
      !this.authService.isSupport() ||
      this.saving() ||
      this.savingPriority() ||
      currentTicket.priority === priority
    ) {
      return;
    }

    const routeVersion = this.routeVersion;

    this.priorityError.set('');
    this.savingPriority.set(true);

    this.ticketService
      .updatePriority(currentTicket.id, priority)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updatedTicket => {
          if (routeVersion !== this.routeVersion) {
            return;
          }

          if (this.ticket()?.id === updatedTicket.id) {
            this.ticket.set(updatedTicket);
            this.historyRefreshKey.update(value => value + 1);
          }

          this.savingPriority.set(false);
        },
        error: () => {
          if (routeVersion !== this.routeVersion) {
            return;
          }

          this.priorityError.set(
            'Kunde inte ändra prioriteten. Försök igen.'
          );
          this.savingPriority.set(false);
        }
      });
  }
}