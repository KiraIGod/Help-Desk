import { IsDateString, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { TICKET_PRIORITIES, TicketPriority } from '../../domain/value-objects/ticket-priority';

export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsIn(TICKET_PRIORITIES)
  priority?: TicketPriority;

  @IsOptional()
  @IsDateString()
  deadlineAt?: string;
}
