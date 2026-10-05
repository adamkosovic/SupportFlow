import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TicketStats } from '../../components/ticket-stats/ticket-stats';
import { SupportTicket } from '../../models/support-ticket';
import { TicketService } from '../../services/ticket.service';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, RouterLink, TicketStats],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  private readonly ticketService = inject(TicketService);

  readonly tickets = signal<SupportTicket[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  readonly urgentTickets = computed(() =>
    this.tickets()
      .filter(ticket =>
        ticket.priority === 'Hög' && ticket.status !== 'Löst'
      )
      .sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .slice(0, 5)
  );

  readonly urgentCount = computed(() =>
    this.tickets().filter(ticket =>
      ticket.priority === 'Hög' && ticket.status !== 'Löst'
    ).length
  );

  ngOnInit(): void {
    this.ticketService.getTickets().subscribe({
      next: tickets => {
        this.tickets.set(tickets);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Kunde inte hämta översikten. Kontrollera att API:et körs.');
        this.loading.set(false);
      }
    });
  }
}