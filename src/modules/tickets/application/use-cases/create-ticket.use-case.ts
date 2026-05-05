import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';

import { AuditAction } from '../../../audit/domain/enums/audit-action.enum';
import { AuditLogOrmEntity } from '../../../audit/infrastructure/persistence/typeorm/audit-log.orm-entity';
import { AuthenticatedUser } from '../../../auth/domain/types/authenticated-user.type';
import { QueueService } from '../../../../infrastructure/queue/queue.service';
import { RedisService } from '../../../../infrastructure/redis/redis.service';
import { TICKET_LIST_KEY_PREFIX } from '../../../../infrastructure/redis/redis.constants';
import { TicketOrmEntity } from '../../infrastructure/persistence/typeorm/ticket.orm-entity';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { TicketResponseDto, toTicketResponse } from '../dto/ticket-response.dto';
import { TicketRepository } from '../ports/ticket-repository.port';
import { TICKET_REPOSITORY } from '../ports/ticket-repository.token';
import { ticketCacheKey } from './ticket-cache.util';

@Injectable()
export class CreateTicketUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly tickets: TicketRepository,
    private readonly dataSource: DataSource,
    private readonly queue: QueueService,
    private readonly redis: RedisService,
  ) {}

  async execute(dto: CreateTicketDto, actor: AuthenticatedUser): Promise<TicketResponseDto> {
    const ticketId = randomUUID();
    const now = new Date();
    const priority = dto.priority ?? 'medium';

    /**
     * Unit-of-work:
     *  [1] INSERT ticket row
     *  [2] INSERT audit_log row
     * If either fails, the whole transaction rolls back atomically.
     */
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(TicketOrmEntity).save(
        manager.getRepository(TicketOrmEntity).create({
          id: ticketId,
          title: dto.title.trim(),
          description: dto.description.trim(),
          requesterId: actor.id,
          executorId: null,
          status: 'open',
          priority,
          deadlineAt: dto.deadlineAt ? new Date(dto.deadlineAt) : null,
          resolvedAt: null,
          closedAt: null,
        }),
      );

      await manager.getRepository(AuditLogOrmEntity).save(
        manager.getRepository(AuditLogOrmEntity).create({
          id: randomUUID(),
          actorId: actor.id,
          action: AuditAction.CREATE_TICKET,
          entityType: 'ticket',
          entityId: ticketId,
          metadata: { priority, deadlineAt: dto.deadlineAt ?? null },
          createdAt: now,
        }),
      );
    });

    const ticket = await this.tickets.findById(ticketId);
    const response = toTicketResponse(ticket!);

    /**
     * Post-commit side effects (non-transactional, best-effort):
     *  [1] Warm the item cache
     *  [2] Invalidate all list caches so the next GET /tickets reflects the new item
     *  [3] Dispatch async email notification via BullMQ
     */
    await Promise.all([
      this.redis.set(ticketCacheKey(ticketId), response),
      this.redis.invalidateByPattern(`${TICKET_LIST_KEY_PREFIX}:*`),
      this.queue.sendEmail({
        type: 'ticket_created',
        recipientUserId: actor.id,
        ticketId,
        subject: `Ticket created: ${ticket!.title}`,
        body: ticket!.description,
      }),
    ]);

    return response;
  }
}
