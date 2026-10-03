import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SupportTicket } from '../models/support-ticket';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private readonly http = inject(HttpClient);

  getTickets() {
    return this.http.get<SupportTicket[]>('/api/tickets');
  }
}