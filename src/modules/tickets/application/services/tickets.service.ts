import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { CacheService } from '../../../../infrastructure/cache/cache.service';
import { EmailNotificationProducer } from '../../../../infrastructure/queues/producers/email-notification.producer';
import { AuditService } from '../../../audit/application/services/audit.service';
import { AuthenticatedUser } from '../../../auth/domain/types/authenticated-user.type';
import { AssignExecutorDto } from '../dto/assign-executor.dto';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { FilterTicketsDto } from '../dto/filter-tickets.dto';
import { TicketResponseDto, toTicketResponse } from '../dto/ticket-response.dto';
import { UpdateTicketStatusDto } from '../dto/update-ticket-status.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { TicketRepository } from '../ports/ticket-repository.port';
import { TICKET_REPOSITORY } from '../ports/ticket-repository.token';

@Injectable()
export class TicketsService {
  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly tickets: TicketRepository,
    private readonly cache: CacheService,
    private readonly emailNotifications: EmailNotificationProducer,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateTicketDto, requester: AuthenticatedUser): Promise<TicketResponseDto> {
    const ticket = await this.tickets.create({
      title: dto.title.trim(),
      description: dto.description.trim(),
      requesterId: requester.id,
      priority: dto.priority ?? 'medium',
      deadlineAt: dto.deadlineAt ? new Date(dto.deadlineAt) : null,
    });
    const response = toTicketResponse(ticket);

    await this.cache.set(this.getTicketCacheKey(ticket.id), response);
    await this.emailNotifications.enqueue({
      type: 'ticket_created',
      recipientUserId: requester.id,
      ticketId: ticket.id,
      subject: `Ticket created: ${ticket.title}`,
      body: ticket.description,
    });
    await this.audit.record({
      actorId: requester.id,
      action: 'ticket.created',
      entityType: 'ticket',
      entityId: ticket.id,
      metadata: {
        priority: ticket.priority,
        deadlineAt: ticket.deadlineAt,
      },
    });

    return response;
  }

  async findAll(filters: FilterTicketsDto): Promise<TicketResponseDto[]> {
    const tickets = await this.tickets.findAll({
      status: filters.status,
      priority: filters.priority,
      requesterId: filters.requesterId,
      executorId: filters.executorId,
      deadlineFrom: filters.deadlineFrom ? new Date(filters.deadlineFrom) : undefined,
      deadlineTo: filters.deadlineTo ? new Date(filters.deadlineTo) : undefined,
      search: filters.search?.trim(),
    });

    return tickets.map(toTicketResponse);
  }

  async findById(id: string): Promise<TicketResponseDto> {
    const cacheKey = this.getTicketCacheKey(id);
    const cachedTicket = await this.cache.get<TicketResponseDto>(cacheKey);

    if (cachedTicket) {
      return cachedTicket;
    }

    const ticket = await this.tickets.findById(id);

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const response = toTicketResponse(ticket);

    await this.cache.set(cacheKey, response);

    return response;
  }

  async update(
    id: string,
    dto: UpdateTicketDto,
    actor: AuthenticatedUser,
  ): Promise<TicketResponseDto> {
    const ticket = await this.tickets.update(id, {
      title: dto.title?.trim(),
      description: dto.description?.trim(),
      priority: dto.priority,
      deadlineAt: dto.deadlineAt ? new Date(dto.deadlineAt) : undefined,
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const response = toTicketResponse(ticket);

    await this.cache.set(this.getTicketCacheKey(id), response);
    await this.audit.record({
      actorId: actor.id,
      action: 'ticket.updated',
      entityType: 'ticket',
      entityId: ticket.id,
      metadata: {
        fields: Object.keys(dto),
      },
    });

    return response;
  }

  async assignExecutor(
    id: string,
    dto: AssignExecutorDto,
    actor: AuthenticatedUser,
  ): Promise<TicketResponseDto> {
    const ticket = await this.tickets.assignExecutor(id, dto.executorId);

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const response = toTicketResponse(ticket);

    await this.cache.set(this.getTicketCacheKey(id), response);
    await this.emailNotifications.enqueue({
      type: 'ticket_assigned',
      recipientUserId: dto.executorId,
      ticketId: ticket.id,
      subject: `Ticket assigned: ${ticket.title}`,
      body: ticket.description,
    });
    await this.audit.record({
      actorId: actor.id,
      action: 'ticket.assigned',
      entityType: 'ticket',
      entityId: ticket.id,
      metadata: {
        executorId: dto.executorId,
      },
    });

    return response;
  }

  async updateStatus(
    id: string,
    dto: UpdateTicketStatusDto,
    actor: AuthenticatedUser,
  ): Promise<TicketResponseDto> {
    const ticket = await this.tickets.updateStatus(id, dto.status);

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const response = toTicketResponse(ticket);

    await this.cache.set(this.getTicketCacheKey(id), response);
    await this.emailNotifications.enqueue({
      type: 'ticket_status_updated',
      recipientUserId: ticket.requesterId,
      ticketId: ticket.id,
      subject: `Ticket status updated: ${ticket.title}`,
      body: `Ticket status changed to ${ticket.status}.`,
    });
    await this.audit.record({
      actorId: actor.id,
      action: 'ticket.status_updated',
      entityType: 'ticket',
      entityId: ticket.id,
      metadata: {
        status: ticket.status,
      },
    });

    return response;
  }

  async softDelete(id: string, actor: AuthenticatedUser): Promise<void> {
    await this.findById(id);
    await this.tickets.softDelete(id);
    await this.cache.del(this.getTicketCacheKey(id));
    await this.audit.record({
      actorId: actor.id,
      action: 'ticket.deleted',
      entityType: 'ticket',
      entityId: id,
    });
  }

  private getTicketCacheKey(id: string): string {
    return `tickets:${id}`;
  }
}
