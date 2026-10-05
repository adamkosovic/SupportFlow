import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
  untracked
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { TicketService } from '../../services/ticket.service';
import { SupportTicket } from '../../models/support-ticket';
import { TicketTable } from '../../components/ticket-table/ticket-table';
import { TicketStats } from '../../components/ticket-stats/ticket-stats';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-tickets-page',
  imports: [FormsModule, TicketStats, TicketTable, RouterLink],
  templateUrl: './tickets-page.html',
  styleUrl: './tickets-page.scss'
})
export class TicketsPage implements OnInit {
  private readonly ticketService = inject(TicketService);
  readonly authService = inject(AuthService);

  readonly tickets = signal<SupportTicket[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly updatingId = signal<number | null>(null);
  readonly statusError = signal('');

  readonly searchTerm = signal('');
  readonly statusFilter = signal('Alla');
  readonly priorityFilter = signal('Alla');
  readonly sortOrder = signal('newest');

  readonly pageSize = 10;
  readonly currentPage = signal(1);

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

  readonly totalPages = computed(() =>
    Math.max(
      1,
      Math.ceil(this.filteredTickets().length / this.pageSize)
    )
  );

  private readonly visiblePage = computed(() =>
    Math.max(1, Math.min(this.currentPage(), this.totalPages()))
  );

  readonly pagedTickets = computed(() => {
    const start = (this.visiblePage() - 1) * this.pageSize;

    return this.filteredTickets().slice(start, start + this.pageSize);
  });

  readonly pageStart = computed(() => {
    if (this.filteredTickets().length === 0) {
      return 0;
    }

    return (this.visiblePage() - 1) * this.pageSize + 1;
  });

  readonly pageEnd = computed(() =>
    Math.min(
      this.visiblePage() * this.pageSize,
      this.filteredTickets().length
    )
  );

  constructor() {
    effect(() => {
      // Börja på första sidan när ett filter eller sorteringen ändras.
      this.searchTerm();
      this.statusFilter();
      this.priorityFilter();
      this.sortOrder();

      untracked(() => this.currentPage.set(1));
    });

    effect(() => {
      // Anpassa sidnumret om antalet träffar minskar.
      const totalPages = this.totalPages();

      untracked(() => {
        this.currentPage.update(page =>
          Math.max(1, Math.min(page, totalPages))
        );
      });
    });
  }

  ngOnInit(): void {
    this.ticketService.getTickets().subscribe({
      next: tickets => {
        this.tickets.set(tickets);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Kunde inte hämta ärenden.');
        this.loading.set(false);
      }
    });
  }

  previousPage(): void {
    this.currentPage.set(Math.max(1, this.visiblePage() - 1));
  }

  nextPage(): void {
    this.currentPage.set(
      Math.min(this.totalPages(), this.visiblePage() + 1)
    );
  }

  updateStatus(ticket: SupportTicket, status: string): void {
    if (this.updatingId() !== null || ticket.status === status) {
      return;
    }

    this.statusError.set('');
    this.updatingId.set(ticket.id);

    this.ticketService.updateStatus(ticket.id, status).subscribe({
      next: updatedTicket => {
        this.tickets.update(tickets =>
          tickets.map(item =>
            item.id === updatedTicket.id ? updatedTicket : item
          )
        );

        this.updatingId.set(null);
      },
      error: () => {
        this.statusError.set('Kunde inte ändra status. Försök igen.');
        this.updatingId.set(null);
      }
    });
  }
}