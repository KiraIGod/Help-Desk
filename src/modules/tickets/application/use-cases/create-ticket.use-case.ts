import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { TRANSACTION_SERVICE, TransactionService } from '../../../../common/transaction/transaction.service';
import { AuditAction } from '../../../audit/domain/enums/audit-action.enum';
import { AuthenticatedUser } from '../../../auth/domain/types/authenticated-user.type';
import { QueueService } from '../../../../infrastructure/queue/queue.service';
import { RedisService } from '../../../../infrastructure/redis/redis.service';
import { TICKET_LIST_KEY_PREFIX } from '../../../../infrastructure/redis/redis.constants';
import { StructuredLoggerService } from '../../../../infrastructure/logger/structured-logger.service';
import { Ticket } from '../../domain/entities/ticket.entity';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { TicketResponseDto, toTicketResponse } from '../dto/ticket-response.dto';
import { ticketCacheKey } from './ticket-cache.util';

@Injectable()
export class CreateTicketUseCase {
  constructor(
    @Inject(TRANSACTION_SERVICE)
    private readonly tx: TransactionService,
    private readonly queue: QueueService,
    private readonly redis: RedisService,
    private readonly logger: StructuredLoggerService,
  ) {}

  async execute(dto: CreateTicketDto, actor: AuthenticatedUser): Promise<TicketResponseDto> {
    const ticketId = randomUUID();
    const priority = dto.priority ?? 'medium';

    const ticket = await this.tx.execute(async (ctx) => {
      const newTicket = Ticket.create({
        id: ticketId,
        title: dto.title.trim(),
        description: dto.description.trim(),
        requesterId: actor.id,
        priority,
        deadlineAt: dto.deadlineAt ? new Date(dto.deadlineAt) : null,
      });

      const saved = await ctx.tickets.save(newTicket);

      await ctx.auditLogs.save({
        actorId: actor.id,
        action: AuditAction.CREATE_TICKET,
        entityType: 'ticket',
        entityId: ticketId,
        metadata: { priority, deadlineAt: dto.deadlineAt ?? null },
      });

      return saved;
    });

    const response = toTicketResponse(ticket);

    await Promise.allSettled([
      this.safeCacheSet(ticketCacheKey(ticketId), response),
      this.safeCacheInvalidate(`${TICKET_LIST_KEY_PREFIX}:*`),
      this.safeQueueSend(actor.id, ticketId, ticket),
    ]);

    this.safeLog(ticketId, actor.id, priority);

    return response;
  }

  private async safeCacheSet(key: string, value: TicketResponseDto): Promise<void> {
    try {
      await this.redis.set(key, value);
    } catch (err) {
      this.logger.warn('cache_set_failed', 'CreateTicketUseCase', { key, error: (err as Error)?.message });
    }
  }

  private async safeCacheInvalidate(pattern: string): Promise<void> {
    try {
      await this.redis.invalidateByPattern(pattern);
    } catch (err) {
      this.logger.warn('cache_invalidate_failed', 'CreateTicketUseCase', { pattern, error: (err as Error)?.message });
    }
  }

  private async safeQueueSend(actorId: string, ticketId: string, ticket: Ticket): Promise<void> {
    try {
      await this.queue.sendEmail({
        type: 'ticket_created',
        recipientUserId: actorId,
        ticketId,
        subject: `Ticket created: ${ticket.title}`,
        body: ticket.description,
      });
    } catch (err) {
      this.logger.error('email_queue_failed', undefined, 'CreateTicketUseCase', { ticketId, error: (err as Error)?.message });
    }
  }

  private safeLog(ticketId: string, actorId: string, priority: string): void {
    try {
      this.logger.log('ticket_created', 'CreateTicketUseCase', { ticketId, actorId, priority });
    } catch {
      // logger failures must never propagate
    }
  }
}
