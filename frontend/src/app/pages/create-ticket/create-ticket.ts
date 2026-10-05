import { Component, inject, signal } from '@angular/core';
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

    this.ticketService.createTicket(request).subscribe({
      next: ticket => {
        this.router.navigate(['/tickets', ticket.id]);
      },
      error: () => {
        this.error.set(
          'Kunde inte skapa ärendet. Kontrollera att API:et körs.'
        );
        this.saving.set(false);
      }
    });
  }
}