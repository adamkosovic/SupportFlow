import { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';
import { Dashboard } from './pages/dashboard/dashboard';
import { TicketsPage } from './pages/tickets-page/tickets-page';
import { CreateTicket } from './pages/create-ticket/create-ticket';
import { TicketDetail } from './pages/ticket-detail/ticket-detail';
import { Login } from './pages/login/login';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: Login,
    title: 'Logga in | SupportFlow'
  },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
    title: 'Översikt | SupportFlow'
  },
  {
    path: 'tickets',
    component: TicketsPage,
    canActivate: [authGuard],
    title: 'Ärenden | SupportFlow'
  },
  {
    path: 'tickets/new',
    component: CreateTicket,
    canActivate: [authGuard],
    title: 'Nytt ärende | SupportFlow'
  },
  {
    path: 'tickets/:id',
    component: TicketDetail,
    canActivate: [authGuard],
    title: 'Ärendedetaljer | SupportFlow'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];