import { Ticket } from '../../domain/entities/ticket.entity';
import { TicketPriority } from '../../domain/value-objects/ticket-priority';
import { TicketStatus } from '../../domain/value-objects/ticket-status';

export interface CreateTicketInput {
  title: string;
  description: string;
  requesterId: string;
  priority: TicketPriority;
  deadlineAt?: Date | null;
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  deadlineAt?: Date | null;
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  requesterId?: string;
  executorId?: string;
  deadlineFrom?: Date;
  deadlineTo?: Date;
  search?: string;
}

export interface TicketRepository {
  create(input: CreateTicketInput): Promise<Ticket>;
  findAll(filters: TicketFilters): Promise<Ticket[]>;
  findById(id: string): Promise<Ticket | null>;
  update(id: string, input: UpdateTicketInput): Promise<Ticket | null>;
  assignExecutor(id: string, executorId: string): Promise<Ticket | null>;
  updateStatus(id: string, status: TicketStatus): Promise<Ticket | null>;
  softDelete(id: string): Promise<void>;
}
