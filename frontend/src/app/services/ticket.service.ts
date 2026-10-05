import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SupportTicket } from '../models/support-ticket';
import { TicketComment } from '../models/ticket-comment';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private readonly http = inject(HttpClient);

  getTickets() {
    return this.http.get<SupportTicket[]>('/api/tickets');
  }

  getTicket(id: number) {
    return this.http.get<SupportTicket>(`/api/tickets/${id}`);
  }

  updateStatus(id: number, status: string) {
    return this.http.patch<SupportTicket>(
      `/api/tickets/${id}/status`,
      { status }
    );
  }

  createTicket(request: { 
    title: string;
    description: string;
    priority: string;
  }) {
    return this.http.post<SupportTicket>('/api/tickets', request);
  }

  getComments(ticketId: number) {
    return this.http.get<TicketComment[]>(
      `/api/tickets/${ticketId}/comments`
    );
  }
  
  createComment(ticketId: number, text: string) {
    return this.http.post<TicketComment>(
      `/api/tickets/${ticketId}/comments`,
      { text }
    );
  }
}