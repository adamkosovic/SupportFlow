import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { TicketService } from './services/ticket.service';
import { SupportTicket } from './models/support-ticket';

@Component({
  selector: 'app-root',
  imports: [DatePipe, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly ticketService = inject(TicketService);

  readonly tickets = signal<SupportTicket[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly saving = signal(false);
  readonly formError = signal('');
  readonly success = signal('');

  title = '';
  description = '';

  ngOnInit(): void {
    this.ticketService.getTickets().subscribe({
      next: (tickets) => {
        // Behåll även ärenden som skapats medan listan laddades.
        this.tickets.update((current) => [
          ...current.filter(
            (item) => !tickets.some((ticket) => ticket.id === item.id)
          ),
          ...tickets,
        ]);

        this.loading.set(false);
      },
      error: () => {
        this.error.set('Kunde inte hämta ärenden.');
        this.loading.set(false);
      },
    });
  }

  createTicket(form: NgForm): void {
    if (this.saving()) {
      return;
    }

    this.formError.set('');
    this.success.set('');

    const title = this.title.trim();
    const description = this.description.trim();

    if (!title || !description) {
      this.formError.set('Fyll i både rubrik och beskrivning.');
      return;
    }

    this.saving.set(true);

    this.ticketService.createTicket({ title, description }).subscribe({
      next: (ticket) => {
        this.tickets.update((tickets) => [ticket, ...tickets]);
        form.resetForm({ title: '', description: '' });

        this.success.set('Ärendet har skapats.');
        this.saving.set(false);
      },
      error: () => {
        this.formError.set(
          'Kunde inte skapa ärendet. Kontrollera att API:et körs.'
        );
        this.saving.set(false);
      },
    });
  }
}