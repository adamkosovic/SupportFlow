import { Component, computed, input } from '@angular/core';
import { SupportTicket } from '../../models/support-ticket';

@Component({
  selector: 'app-ticket-stats',
  imports: [],
  templateUrl: './ticket-stats.html',
  styleUrl: './ticket-stats.scss'
})
export class TicketStats {
  readonly tickets = input.required<SupportTicket[]>();

  readonly stats = computed(() => {
    const tickets = this.tickets();

    return [
      {
        label: 'Totalt antal ärenden',
        value: tickets.length,
        type: 'total'
      },
      {
        label: 'Nya ärenden',
        value: tickets.filter(ticket => ticket.status === 'Nytt').length,
        type: 'new'
      },
      {
        label: 'Pågående ärenden',
        value: tickets.filter(ticket => ticket.status === 'Pågår').length,
        type: 'ongoing'
      },
      {
        label: 'Lösta ärenden',
        value: tickets.filter(ticket => ticket.status === 'Löst').length,
        type: 'resolved'
      }
    ];
  });
}