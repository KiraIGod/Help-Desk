import { Injectable } from '@nestjs/common';

import {
  PaginatedTickets,
  TicketFilters,
  TicketRepository,
} from '../../application/ports/ticket-repository.port';
import { Ticket } from '../../domain/entities/ticket.entity';

@Injectable()
export class InMemoryTicketRepository implements TicketRepository {
  private readonly tickets = new Map<string, Ticket>();

  async save(ticket: Ticket): Promise<Ticket> {
    this.tickets.set(ticket.id, ticket);

    return ticket;
  }

  async findAll(filters: TicketFilters): Promise<PaginatedTickets> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const matched = [...this.tickets.values()]
      .filter((ticket) => !ticket.deletedAt)
      .filter((ticket) => this.matchesFilters(ticket, filters))
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

    const total = matched.length;
    const data = matched.slice((page - 1) * limit, page * limit);

    return { data, total, page, limit };
  }

  async findById(id: string): Promise<Ticket | null> {
    const ticket = this.tickets.get(id);

    if (!ticket || ticket.deletedAt) {
      return null;
    }

    return ticket;
  }

  async findByIdForUpdate(id: string): Promise<Ticket | null> {
    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    const ticket = await this.findById(id);

    if (!ticket) {
      return;
    }

    this.tickets.set(id, ticket.softDelete());
  }

  private matchesFilters(ticket: Ticket, filters: TicketFilters): boolean {
    if (filters.status && ticket.status !== filters.status) {
      return false;
    }

    if (filters.priority && ticket.priority !== filters.priority) {
      return false;
    }

    if (filters.requesterId && ticket.requesterId !== filters.requesterId) {
      return false;
    }

    if (filters.executorId && ticket.executorId !== filters.executorId) {
      return false;
    }

    if (filters.deadlineFrom && (!ticket.deadlineAt || ticket.deadlineAt < filters.deadlineFrom)) {
      return false;
    }

    if (filters.deadlineTo && (!ticket.deadlineAt || ticket.deadlineAt > filters.deadlineTo)) {
      return false;
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      const content = `${ticket.title} ${ticket.description}`.toLowerCase();

      return content.includes(search);
    }

    return true;
  }
}
