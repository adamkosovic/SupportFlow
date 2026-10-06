import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SupportTicket } from '../models/support-ticket';
import { TicketComment } from '../models/ticket-comment';
import { TicketAssignment } from '../models/ticket-assignment';
import { TicketHistory } from '../models/ticket-history';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private readonly http = inject(HttpClient);

  getTickets(assignment: string = 'all') {
    return this.http.get<SupportTicket[]>('/api/tickets', {
      params: { assignment }
    });
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

  updatePriority(id: number, priority: string) {
    return this.http.patch<SupportTicket>(
      `/api/tickets/${id}/priority`,
      { priority }
    );
  }

  getAssignment(ticketId: number) {
    return this.http.get<TicketAssignment>(
      `/api/tickets/${ticketId}/assignment`
    );
  }
  
  assignToMe(ticketId: number) {
    return this.http.put<void>(
      `/api/tickets/${ticketId}/assignment/me`,
      {}
    );
  }
  
  releaseAssignment(ticketId: number) {
    return this.http.delete<void>(
      `/api/tickets/${ticketId}/assignment/me`
    );
  }

  getHistory(ticketId: number) {
    return this.http.get<TicketHistory[]>(
      `/api/tickets/${ticketId}/history`
    );
  }
}