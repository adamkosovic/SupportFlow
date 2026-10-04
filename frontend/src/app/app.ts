import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TicketService } from './services/ticket.service';
import { SupportTicket } from './models/support-ticket';
import { TicketForm } from './components/ticket-form/ticket-form';
import { AppLayout } from './components/app-layout/app-layout';
import { TicketStats } from './components/ticket-stats/ticket-stats';
import { TicketTable } from './components/ticket-table/ticket-table';

@Component({
  selector: 'app-root',
  imports: [
    FormsModule,
    TicketForm,
    AppLayout,
    TicketStats,
    TicketTable
  ],
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

  readonly updatingId = signal<number | null>(null);
  readonly statusError = signal('');

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

  readonly searchTerm = signal('');
  readonly statusFilter = signal('Alla');

  readonly filteredTickets = computed(() => {
    const search = this.searchTerm().trim().toLocaleLowerCase('sv');
    const status = this.statusFilter();

    return this.tickets().filter((ticket) => {
      const matchesSearch =
        ticket.title.toLocaleLowerCase('sv').includes(search) ||
        ticket.description.toLocaleLowerCase('sv').includes(search);

      const matchesStatus =
        status === 'Alla' || ticket.status === status;

      return matchesSearch && matchesStatus;
    });
  });

  createTicket(request: { title: string; description: string }): void {
    if (this.saving()) {
      return;
    }
  
    this.formError.set('');
    this.success.set('');
    this.saving.set(true);
  
    this.ticketService.createTicket(request).subscribe({
      next: (ticket) => {
        this.tickets.update((tickets) => [ticket, ...tickets]);
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
  
  updateStatus(ticket: SupportTicket, status: string): void {
    if (this.updatingId() !== null || ticket.status === status) {
      return;
    }
  
    this.statusError.set('');
    this.updatingId.set(ticket.id);
  
    this.ticketService.updateStatus(ticket.id, status).subscribe({
      next: (updatedTicket) => {
        this.tickets.update((tickets) =>
          tickets.map((item) =>
            item.id === updatedTicket.id ? updatedTicket : item
          )
        );
  
        this.updatingId.set(null);
      },
      error: () => {
        this.statusError.set('Kunde inte ändra status. Försök igen.');
        this.updatingId.set(null);
      },
    });
  }
}