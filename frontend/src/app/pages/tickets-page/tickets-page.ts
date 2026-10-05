import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../services/ticket.service';
import { SupportTicket } from '../../models/support-ticket';
import { TicketTable } from '../../components/ticket-table/ticket-table';
import { TicketStats } from '../../components/ticket-stats/ticket-stats';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-tickets-page',
  imports: [
    FormsModule,
    TicketStats,
    TicketTable,
    RouterLink
  ],
  templateUrl: './tickets-page.html',
  styleUrl: './tickets-page.scss'
})
export class TicketsPage implements OnInit {
  private readonly ticketService = inject(TicketService);

  readonly tickets = signal<SupportTicket[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly updatingId = signal<number | null>(null);
  readonly statusError = signal('');
  readonly sortOrder = signal('newest');

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
  readonly priorityFilter = signal('Alla');

  readonly filteredTickets = computed(() => {
    const search = this.searchTerm().trim().toLocaleLowerCase('sv');
    const status = this.statusFilter();
    const priority = this.priorityFilter();
    const sortOrder = this.sortOrder();
  
    const tickets = this.tickets().filter(ticket => {
      const matchesSearch =
        ticket.title.toLocaleLowerCase('sv').includes(search) ||
        ticket.description.toLocaleLowerCase('sv').includes(search);
  
      const matchesStatus =
        status === 'Alla' || ticket.status === status;
  
      const matchesPriority =
        priority === 'Alla' || ticket.priority === priority;
  
      return matchesSearch && matchesStatus && matchesPriority;
    });
  
    const priorityRank: Record<string, number> = {
      Hög: 3,
      Normal: 2,
      Låg: 1
    };
  
    return tickets.sort((a, b) => {
      const dateDifference =
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime();
  
      if (sortOrder === 'oldest') {
        return dateDifference || a.id - b.id;
      }
  
      if (sortOrder === 'priority') {
        const priorityDifference =
          (priorityRank[b.priority] ?? 0) -
          (priorityRank[a.priority] ?? 0);
  
        // Vid samma prioritet visas det äldsta ärendet först.
        return priorityDifference || dateDifference || a.id - b.id;
      }
  
      return -dateDifference || b.id - a.id;
    });
  });
  
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