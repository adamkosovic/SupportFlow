import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { SupportTicket } from '../../models/support-ticket';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-ticket-table',
  imports: [DatePipe, RouterLink],
  templateUrl: './ticket-table.html',
  styleUrl: './ticket-table.scss'
})
export class TicketTable {
  readonly tickets = input.required<SupportTicket[]>();
  readonly updatingId = input<number | null>(null);
  readonly canManage = input(false);

  readonly statusChange = output<{
    ticket: SupportTicket;
    status: string;
  }>();

  changeStatus(ticket: SupportTicket, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const status = select.value;

    // Visa sparad status tills API:et har bekräftat ändringen.
    select.value = ticket.status;

    if (this.updatingId() !== null || status === ticket.status) {
      return;
    }

    this.statusChange.emit({ ticket, status });
  }
}