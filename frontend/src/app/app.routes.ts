import { Routes } from '@angular/router';
import { TicketsPage } from './pages/tickets-page/tickets-page';
import { TicketDetail } from './pages/ticket-detail/ticket-detail';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tickets',
    pathMatch: 'full'
  },
  {
    path: 'tickets',
    component: TicketsPage,
    title: 'Ärenden | SupportFlow'
  },
  {
    path: 'tickets/:id',
    component: TicketDetail,
    title: 'Ärendedetaljer | SupportFlow'
  },
  {
    path: '**',
    redirectTo: 'tickets'
  }
];