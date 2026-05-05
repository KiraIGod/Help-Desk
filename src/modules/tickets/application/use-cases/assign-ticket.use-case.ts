import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { TRANSACTION_SERVICE, TransactionService } from '../../../../common/transaction/transaction.service';
import { AuditAction } from '../../../audit/domain/enums/audit-action.enum';
import { AuthenticatedUser } from '../../../auth/domain/types/authenticated-user.type';
import { QueueService } from '../../../../infrastructure/queue/queue.service';
import { RedisService } from '../../../../infrastructure/redis/redis.service';
import { TICKET_LIST_KEY_PREFIX } from '../../../../infrastructure/redis/redis.constants';
import { StructuredLoggerService } from '../../../../infrastructure/logger/structured-logger.service';
import { AssignExecutorDto } from '../dto/assign-executor.dto';
import { TicketResponseDto, toTicketResponse } from '../dto/ticket-response.dto';
import { ticketCacheKey } from './ticket-cache.util';

@Injectable()
export class AssignTicketUseCase {
  constructor(
    @Inject(TRANSACTION_SERVICE)
    private readonly tx: TransactionService,
    private readonly queue: QueueService,
    private readonly redis: RedisService,
    private readonly logger: StructuredLoggerService,
  ) {}

  async execute(
    ticketId: string,
    dto: AssignExecutorDto,
    actor: AuthenticatedUser,
  ): Promise<TicketResponseDto> {
    const ticket = await this.tx.execute(async (ctx) => {
      const existing = await ctx.tickets.findByIdForUpdate(ticketId);

      if (!existing) {
        throw new NotFoundException('Ticket not found');
      }

      const updated = existing.assignExecutor(dto.executorId);
      const saved = await ctx.tickets.save(updated);

      await ctx.auditLogs.save({
        actorId: actor.id,
        action: AuditAction.ASSIGN_TICKET,
        entityType: 'ticket',
        entityId: ticketId,
        metadata: {
          executorId: dto.executorId,
          previousExecutorId: existing.executorId,
          statusTransition: existing.status !== updated.status
            ? { from: existing.status, to: updated.status }
            : null,
        },
      });

      return saved;
    });

    const response = toTicketResponse(ticket);

    await Promise.allSettled([
      this.redis.set(ticketCacheKey(ticketId), response).catch((err) => {
        this.logger.warn('cache_set_failed', 'AssignTicketUseCase', { key: ticketCacheKey(ticketId), error: err?.message });
      }),
      this.redis.invalidateByPattern(`${TICKET_LIST_KEY_PREFIX}:*`).catch((err) => {
        this.logger.warn('cache_invalidate_failed', 'AssignTicketUseCase', { error: err?.message });
      }),
      this.queue.sendEmail({
        type: 'ticket_assigned',
        recipientUserId: dto.executorId,
        ticketId,
        subject: `Ticket assigned: ${ticket.title}`,
        body: ticket.description,
      }).catch((err) => {
        this.logger.error('email_queue_failed', undefined, 'AssignTicketUseCase', { ticketId, error: (err as Error)?.message });
      }),
    ]);

    return response;
  }
}
