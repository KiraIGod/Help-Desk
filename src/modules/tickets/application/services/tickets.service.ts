import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';

import { RedisService } from '../../../../infrastructure/redis/redis.service';
import {
  TICKET_ITEM_CACHE_TTL,
  TICKET_LIST_CACHE_TTL,
  TICKET_LIST_KEY_PREFIX,
} from '../../../../infrastructure/redis/redis.constants';
import { AuthenticatedUser } from '../../../auth/domain/types/authenticated-user.type';
import { AssignExecutorDto } from '../dto/assign-executor.dto';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { FilterTicketsDto } from '../dto/filter-tickets.dto';
import { PaginatedTicketResponseDto, TicketResponseDto, toTicketResponse } from '../dto/ticket-response.dto';
import { UpdateTicketStatusDto } from '../dto/update-ticket-status.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { TicketRepository } from '../ports/ticket-repository.port';
import { TICKET_REPOSITORY } from '../ports/ticket-repository.token';
import { AssignTicketUseCase } from '../use-cases/assign-ticket.use-case';
import { ChangeTicketStatusUseCase } from '../use-cases/change-ticket-status.use-case';
import { CreateTicketUseCase } from '../use-cases/create-ticket.use-case';
import { DeleteTicketUseCase } from '../use-cases/delete-ticket.use-case';
import { ticketCacheKey } from '../use-cases/ticket-cache.util';
import { UpdateTicketUseCase } from '../use-cases/update-ticket.use-case';

/**
 * TicketsService is a thin orchestration facade.
 *
 * Write operations are delegated to dedicated use-case classes that own
 * transaction logic, cache invalidation, and async notifications.
 *
 * Read operations live here because they are pure queries with no side effects.
 */
@Injectable()
export class TicketsService {
  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly tickets: TicketRepository,
    private readonly redis: RedisService,
    private readonly createTicketUseCase: CreateTicketUseCase,
    private readonly assignTicketUseCase: AssignTicketUseCase,
    private readonly changeTicketStatusUseCase: ChangeTicketStatusUseCase,
    private readonly updateTicketUseCase: UpdateTicketUseCase,
    private readonly deleteTicketUseCase: DeleteTicketUseCase,
  ) {}

  // ─── Commands ────────────────────────────────────────────────────────────

  async create(dto: CreateTicketDto, actor: AuthenticatedUser): Promise<TicketResponseDto> {
    return this.createTicketUseCase.execute(dto, actor);
  }

  async update(
    id: string,
    dto: UpdateTicketDto,
    actor: AuthenticatedUser,
  ): Promise<TicketResponseDto> {
    return this.updateTicketUseCase.execute(id, dto, actor);
  }

  async assignExecutor(
    id: string,
    dto: AssignExecutorDto,
    actor: AuthenticatedUser,
  ): Promise<TicketResponseDto> {
    return this.assignTicketUseCase.execute(id, dto, actor);
  }

  async updateStatus(
    id: string,
    dto: UpdateTicketStatusDto,
    actor: AuthenticatedUser,
  ): Promise<TicketResponseDto> {
    return this.changeTicketStatusUseCase.execute(id, dto, actor);
  }

  async softDelete(id: string, actor: AuthenticatedUser): Promise<void> {
    return this.deleteTicketUseCase.execute(id, actor);
  }

  // ─── Queries ─────────────────────────────────────────────────────────────

  async findAll(filters: FilterTicketsDto): Promise<PaginatedTicketResponseDto> {
    const cacheKey = this.buildListCacheKey(filters);
    const cached = await this.redis.get<PaginatedTicketResponseDto>(cacheKey);

    if (cached) {
      return cached;
    }

    const result = await this.tickets.findAll({
      status: filters.status,
      priority: filters.priority,
      requesterId: filters.requesterId,
      executorId: filters.executorId,
      deadlineFrom: filters.deadlineFrom ? new Date(filters.deadlineFrom) : undefined,
      deadlineTo: filters.deadlineTo ? new Date(filters.deadlineTo) : undefined,
      search: filters.search?.trim(),
      page: filters.page,
      limit: filters.limit,
    });

    const response: PaginatedTicketResponseDto = {
      data: result.data.map(toTicketResponse),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };

    await this.redis.set(cacheKey, response, TICKET_LIST_CACHE_TTL);

    return response;
  }

  async findById(id: string): Promise<TicketResponseDto> {
    const cacheKey = ticketCacheKey(id);
    const cached = await this.redis.get<TicketResponseDto>(cacheKey);

    if (cached) {
      return cached;
    }

    const ticket = await this.tickets.findById(id);

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const response = toTicketResponse(ticket);

    await this.redis.set(cacheKey, response, TICKET_ITEM_CACHE_TTL);

    return response;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /**
   * Builds a deterministic Redis key from filter parameters.
   * Uses a short SHA-256 hash to keep keys concise and collision-free.
   *
   * Pattern: tickets:list:{sha256(sorted-params)}
   */
  private buildListCacheKey(filters: FilterTicketsDto): string {
    const params = {
      p: filters.page ?? 1,
      l: filters.limit ?? 20,
      s: filters.status ?? '',
      pr: filters.priority ?? '',
      rId: filters.requesterId ?? '',
      eId: filters.executorId ?? '',
      q: filters.search ?? '',
      df: filters.deadlineFrom ?? '',
      dt: filters.deadlineTo ?? '',
    };

    const hash = createHash('sha256')
      .update(JSON.stringify(params))
      .digest('hex')
      .slice(0, 16);

    return `${TICKET_LIST_KEY_PREFIX}:${hash}`;
  }
}
