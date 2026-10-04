import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SupportTicket } from '../../models/support-ticket';

@Component({
  selector: 'app-ticket-card',
  imports: [DatePipe],
  templateUrl: './ticket-card.html',
  styleUrl: './ticket-card.scss',
})
export class TicketCard {
  readonly ticket = input.required<SupportTicket>();
  readonly updating = input(false);
  readonly disabled = input(false);

  readonly statusChange = output<string>();
}