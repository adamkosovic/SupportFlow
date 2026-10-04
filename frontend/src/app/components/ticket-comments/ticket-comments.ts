import { DatePipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';

import { TicketComment } from '../../models/ticket-comment';
import { TicketService } from '../../services/ticket.service';

@Component({
  selector: 'app-ticket-comments',
  imports: [DatePipe, FormsModule],
  templateUrl: './ticket-comments.html',
  styleUrl: './ticket-comments.scss'
})
export class TicketComments {
  private readonly ticketService = inject(TicketService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ticketId = input.required<number>();

  readonly comments = signal<TicketComment[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly success = signal('');

  text = '';

  constructor() {
    effect(onCleanup => {
      const id = this.ticketId();

      this.comments.set([]);
      this.loading.set(true);
      this.loadError.set('');
      this.formError.set('');
      this.success.set('');
      this.text = '';

      const subscription = this.ticketService.getComments(id).subscribe({
        next: comments => {
          this.comments.set(comments);
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set('Kunde inte hämta kommentarerna.');
          this.loading.set(false);
        }
      });

      onCleanup(() => subscription.unsubscribe());
    });
  }

  submit(form: NgForm): void {
    if (this.saving() || this.loading() || this.loadError()) {
      return;
    }

    const text = this.text.trim();

    this.formError.set('');
    this.success.set('');

    if (!text) {
      this.formError.set('Skriv en kommentar.');
      return;
    }

    if (text.length > 2000) {
      this.formError.set('Kommentaren får innehålla högst 2 000 tecken.');
      return;
    }

    const ticketId = this.ticketId();
    this.saving.set(true);

    this.ticketService.createComment(ticketId, text).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: comment => {
        if (this.ticketId() === ticketId) {
          this.comments.update(comments => [...comments, comment]);
          form.resetForm({ text: '' });
          this.success.set('Kommentaren har sparats.');
        }

        this.saving.set(false);
      },
      error: () => {
        if (this.ticketId() === ticketId) {
          this.formError.set(
            'Kunde inte spara kommentaren. Försök igen.'
          );
        }

        this.saving.set(false);
      }
    });
  }
}