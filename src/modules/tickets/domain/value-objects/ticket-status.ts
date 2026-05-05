export const TICKET_STATUSES = [
  'open',
  'in_progress',
  'pending',
  'resolved',
  'closed',
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];
