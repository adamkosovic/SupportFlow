import { DatePipe } from '@angular/common';
import {
  Component,
  effect,
  inject,
  input,
  signal
} from '@angular/core';

import { TicketService } from '../../services/ticket.service';
import { TicketHistory as HistoryEntry } from '../../models/ticket-history';

@Component({
  selector: 'app-ticket-history',
  imports: [DatePipe],
  templateUrl: './ticket-history.html',
  styleUrl: './ticket-history.scss'
})
export class TicketHistory {
  private readonly ticketService = inject(TicketService);

  readonly ticketId = input.required<number>();

  // Ändra detta värde när historiken behöver hämtas igen.
  readonly refreshKey = input(0);

  readonly history = signal<HistoryEntry[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    effect(onCleanup => {
      const ticketId = this.ticketId();
      this.refreshKey();

      this.loading.set(true);
      this.error.set('');
      this.history.set([]);

      const subscription = this.ticketService
        .getHistory(ticketId)
        .subscribe({
          next: history => {
            this.history.set(history);
            this.loading.set(false);
          },
          error: () => {
            this.error.set('Kunde inte hämta ärendehistoriken.');
            this.loading.set(false);
          }
        });

      onCleanup(() => subscription.unsubscribe());
    });
  }

  describe(entry: HistoryEntry): string {
    switch (entry.action) {
      case 'StatusChanged':
        return `ändrade status från ${entry.oldValue} till ${entry.newValue}.`;
  
      case 'PriorityChanged':
        return `ändrade prioritet från ${entry.oldValue} till ${entry.newValue}.`;
  
      case 'Assigned':
        return 'tog ansvar för ärendet.';
  
      case 'AssignmentReleased':
        return 'släppte ansvaret för ärendet.';
  
      default:
        return 'uppdaterade ärendet.';
    }
  }
}