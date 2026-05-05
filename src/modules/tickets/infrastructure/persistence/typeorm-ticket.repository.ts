import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';

import {
  PaginatedTickets,
  TicketFilters,
  TicketRepository,
} from '../../application/ports/ticket-repository.port';
import { Ticket } from '../../domain/entities/ticket.entity';
import { TicketOrmEntity } from './typeorm/ticket.orm-entity';

@Injectable()
export class TypeOrmTicketRepository implements TicketRepository {
  constructor(
    @InjectRepository(TicketOrmEntity)
    private readonly repo: Repository<TicketOrmEntity>,
  ) {}

  async save(ticket: Ticket): Promise<Ticket> {
    const result = await this.repo.save({
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
    });

    return this.toDomain(result);
  }

  async findAll(filters: TicketFilters): Promise<PaginatedTickets> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder('ticket')
      .where('ticket.deleted_at IS NULL');

    if (filters.status) {
      qb.andWhere('ticket.status = :status', { status: filters.status });
    }

    if (filters.priority) {
      qb.andWhere('ticket.priority = :priority', { priority: filters.priority });
    }

    if (filters.requesterId) {
      qb.andWhere('ticket.requester_id = :requesterId', { requesterId: filters.requesterId });
    }

    if (filters.executorId) {
      qb.andWhere('ticket.executor_id = :executorId', { executorId: filters.executorId });
    }

    if (filters.deadlineFrom) {
      qb.andWhere('ticket.deadline_at >= :deadlineFrom', { deadlineFrom: filters.deadlineFrom });
    }

    if (filters.deadlineTo) {
      qb.andWhere('ticket.deadline_at <= :deadlineTo', { deadlineTo: filters.deadlineTo });
    }

    if (filters.search) {
      qb.andWhere(
        new Brackets((inner) => {
          inner
            .where('ticket.title ILIKE :search', { search: `%${filters.search}%` })
            .orWhere('ticket.description ILIKE :search', { search: `%${filters.search}%` });
        }),
      );
    }

    const [entities, total] = await qb
      .orderBy('ticket.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: entities.map((e) => this.toDomain(e)),
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<Ticket | null> {
    const entity = await this.repo.findOne({ where: { id } });

    return entity ? this.toDomain(entity) : null;
  }

  async findByIdForUpdate(id: string): Promise<Ticket | null> {
    const entity = await this.repo.findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });

    return entity ? this.toDomain(entity) : null;
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  private toDomain(entity: TicketOrmEntity): Ticket {
    return new Ticket(
      entity.id,
      entity.title,
      entity.description,
      entity.requesterId,
      entity.executorId,
      entity.status,
      entity.priority,
      entity.deadlineAt,
      entity.createdAt,
      entity.updatedAt,
      entity.resolvedAt,
      entity.closedAt,
      entity.deletedAt,
    );
  }
}
