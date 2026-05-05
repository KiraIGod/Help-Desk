import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Brackets, Repository } from 'typeorm';

import {
  CreateTicketInput,
  PaginatedTickets,
  TicketFilters,
  TicketRepository,
  UpdateTicketInput,
} from '../../application/ports/ticket-repository.port';
import { Ticket } from '../../domain/entities/ticket.entity';
import { TicketStatus } from '../../domain/value-objects/ticket-status';
import { TicketOrmEntity } from './typeorm/ticket.orm-entity';

@Injectable()
export class TypeOrmTicketRepository implements TicketRepository {
  constructor(
    @InjectRepository(TicketOrmEntity)
    private readonly repo: Repository<TicketOrmEntity>,
  ) {}

  async create(input: CreateTicketInput): Promise<Ticket> {
    const entity = this.repo.create({
      id: randomUUID(),
      title: input.title,
      description: input.description,
      requesterId: input.requesterId,
      executorId: null,
      status: 'open',
      priority: input.priority,
      deadlineAt: input.deadlineAt ?? null,
      resolvedAt: null,
      closedAt: null,
    });

    const saved = await this.repo.save(entity);

    return this.toDomain(saved);
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

  async update(id: string, input: UpdateTicketInput): Promise<Ticket | null> {
    const entity = await this.repo.findOne({ where: { id } });

    if (!entity) {
      return null;
    }

    Object.assign(entity, {
      title: input.title ?? entity.title,
      description: input.description ?? entity.description,
      priority: input.priority ?? entity.priority,
      deadlineAt: input.deadlineAt === undefined ? entity.deadlineAt : input.deadlineAt,
    });

    const saved = await this.repo.save(entity);

    return this.toDomain(saved);
  }

  async assignExecutor(id: string, executorId: string): Promise<Ticket | null> {
    const entity = await this.repo.findOne({ where: { id } });

    if (!entity) {
      return null;
    }

    entity.executorId = executorId;

    if (entity.status === 'open') {
      entity.status = 'in_progress';
    }

    const saved = await this.repo.save(entity);

    return this.toDomain(saved);
  }

  async updateStatus(id: string, status: TicketStatus): Promise<Ticket | null> {
    const entity = await this.repo.findOne({ where: { id } });

    if (!entity) {
      return null;
    }

    const now = new Date();

    entity.status = status;

    if (status === 'resolved') {
      entity.resolvedAt = now;
      entity.closedAt = null;
    } else if (status === 'closed') {
      entity.closedAt = now;
    }

    const saved = await this.repo.save(entity);

    return this.toDomain(saved);
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
