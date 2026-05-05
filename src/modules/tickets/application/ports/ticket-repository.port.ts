import { Ticket } from '../../domain/entities/ticket.entity';
import { TicketPriority } from '../../domain/value-objects/ticket-priority';
import { TicketStatus } from '../../domain/value-objects/ticket-status';

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  requesterId?: string;
  executorId?: string;
  deadlineFrom?: Date;
  deadlineTo?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedTickets {
  data: Ticket[];
  total: number;
  page: number;
  limit: number;
}

export interface TicketRepository {
  save(ticket: Ticket): Promise<Ticket>;
  findAll(filters: TicketFilters): Promise<PaginatedTickets>;
  findById(id: string): Promise<Ticket | null>;
  findByIdForUpdate(id: string): Promise<Ticket | null>;
  softDelete(id: string): Promise<void>;
}
