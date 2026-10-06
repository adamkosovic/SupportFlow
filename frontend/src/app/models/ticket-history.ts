export interface TicketHistory {
  id: number;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  changedByEmail: string | null;
  createdAt: string;
}