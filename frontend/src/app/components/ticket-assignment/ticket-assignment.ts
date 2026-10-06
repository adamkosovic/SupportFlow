import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, tap } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { TicketService } from '../../services/ticket.service';
import { TicketAssignment as Assignment } from '../../models/ticket-assignment';

@Component({
  selector: 'app-ticket-assignment',
  imports: [],
  templateUrl: './ticket-assignment.html',
  styleUrl: './ticket-assignment.scss'
})
export class TicketAssignment {
  private readonly ticketService = inject(TicketService);
  private readonly destroyRef = inject(DestroyRef);

  readonly authService = inject(AuthService);
  readonly ticketId = input.required<number>();

  readonly assignmentChanged = output<void>();

  readonly assignment = signal<Assignment | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');

  private ticketVersion = 0;

  constructor() {
    effect(onCleanup => {
      const id = this.ticketId();
      const version = ++this.ticketVersion;

      this.assignment.set(null);
      this.loading.set(true);
      this.saving.set(false);
      this.error.set('');

      const subscription = this.ticketService
        .getAssignment(id)
        .subscribe({
          next: assignment => {
            if (
              version !== this.ticketVersion ||
              this.ticketId() !== id
            ) {
              return;
            }

            this.assignment.set(assignment);
            this.loading.set(false);
          },
          error: () => {
            if (
              version !== this.ticketVersion ||
              this.ticketId() !== id
            ) {
              return;
            }

            this.error.set('Kunde inte hämta handläggaren.');
            this.loading.set(false);
          }
        });

      onCleanup(() => subscription.unsubscribe());
    });
  }

  changeAssignment(release: boolean): void {
    if (
      this.loading() ||
      this.saving() ||
      !this.assignment() ||
      !this.authService.isSupport()
    ) {
      return;
    }

    const id = this.ticketId();
    const version = this.ticketVersion;

    this.saving.set(true);
    this.error.set('');

    const request = release
      ? this.ticketService.releaseAssignment(id)
      : this.ticketService.assignToMe(id);

    request
      .pipe(
        tap(() => {
          // Tilldelningen är sparad. Meddela detaljsidan.
          if (
            version === this.ticketVersion &&
            this.ticketId() === id
          ) {
            this.assignmentChanged.emit();
          }
        }),
        switchMap(() => this.ticketService.getAssignment(id)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: assignment => {
          if (
            version !== this.ticketVersion ||
            this.ticketId() !== id
          ) {
            return;
          }

          this.assignment.set(assignment);
          this.saving.set(false);
        },
        error: (error: HttpErrorResponse) => {
          if (
            version !== this.ticketVersion ||
            this.ticketId() !== id
          ) {
            return;
          }

          this.error.set(
            error.status === 409
              ? 'Tilldelningen har ändrats. Uppdatera sidan och försök igen.'
              : 'Kunde inte uppdatera handläggaren. Uppdatera sidan för att kontrollera tilldelningen.'
          );

          this.saving.set(false);
        }
      });
  }
}