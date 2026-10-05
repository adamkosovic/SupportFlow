import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { TicketsPage } from './pages/tickets-page/tickets-page';
import { TicketDetail } from './pages/ticket-detail/ticket-detail';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: Dashboard,
    title: 'Översikt | SupportFlow'
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
    redirectTo: 'dashboard'
  }
];