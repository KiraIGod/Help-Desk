import { IsIn } from 'class-validator';

import { TICKET_STATUSES, TicketStatus } from '../../domain/value-objects/ticket-status';

export class UpdateTicketStatusDto {
  @IsIn(TICKET_STATUSES)
  status!: TicketStatus;
}
