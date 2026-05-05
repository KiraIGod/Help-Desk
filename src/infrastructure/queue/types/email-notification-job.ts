export type EmailNotificationType =
  | 'ticket_created'
  | 'ticket_assigned'
  | 'ticket_status_updated'
  | 'ticket_deleted';

export interface EmailNotificationJob {
  type: EmailNotificationType;
  recipientUserId: string;
  ticketId: string;
  subject: string;
  body: string;
}
