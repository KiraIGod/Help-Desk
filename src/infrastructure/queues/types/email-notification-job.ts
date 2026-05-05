export type EmailNotificationType =
  | 'ticket_created'
  | 'ticket_assigned'
  | 'ticket_status_updated';

export interface EmailNotificationJob {
  type: EmailNotificationType;
  recipientUserId: string;
  ticketId: string;
  subject: string;
  body: string;
}
