import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { TicketsPage } from './pages/tickets-page/tickets-page';
import { TicketDetail } from './pages/ticket-detail/ticket-detail';
import { CreateTicket } from './pages/create-ticket/create-ticket';
import { Login } from './pages/login/login';

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
    path: 'tickets/new',
    component: CreateTicket,
    title: 'Nytt ärende | SupportFlow'
  },
  {
    path: 'tickets/:id',
    component: TicketDetail,
    title: 'Ärendedetaljer | SupportFlow'
  },
  {
    path: 'login',
    component: Login,
    title: 'Logga in | SupportFlow'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];