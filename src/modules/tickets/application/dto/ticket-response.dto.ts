import { Ticket } from '../../domain/entities/ticket.entity';
import { TicketPriority } from '../../domain/value-objects/ticket-priority';
import { TicketStatus } from '../../domain/value-objects/ticket-status';

export interface TicketResponseDto {
  id: string;
  title: string;
  description: string;
  requesterId: string;
  executorId: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  deadlineAt: Date | null;
  resolvedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedTicketResponseDto {
  data: TicketResponseDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const toTicketResponse = (ticket: Ticket): TicketResponseDto => ({
  id: ticket.id,
  title: ticket.title,
  description: ticket.description,
  requesterId: ticket.requesterId,
  executorId: ticket.executorId,
  status: ticket.status,
  priority: ticket.priority,
  deadlineAt: ticket.deadlineAt,
  resolvedAt: ticket.resolvedAt,
  closedAt: ticket.closedAt,
  createdAt: ticket.createdAt,
  updatedAt: ticket.updatedAt,
});
