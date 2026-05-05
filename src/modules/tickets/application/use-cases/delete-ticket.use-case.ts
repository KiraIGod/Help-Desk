import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { TRANSACTION_SERVICE, TransactionService } from '../../../../common/transaction/transaction.service';
import { AuditAction } from '../../../audit/domain/enums/audit-action.enum';
import { AuthenticatedUser } from '../../../auth/domain/types/authenticated-user.type';
import { RedisService } from '../../../../infrastructure/redis/redis.service';
import { TICKET_LIST_KEY_PREFIX } from '../../../../infrastructure/redis/redis.constants';
import { StructuredLoggerService } from '../../../../infrastructure/logger/structured-logger.service';
import { ticketCacheKey } from './ticket-cache.util';

@Injectable()
export class DeleteTicketUseCase {
  constructor(
    @Inject(TRANSACTION_SERVICE)
    private readonly tx: TransactionService,
    private readonly redis: RedisService,
    private readonly logger: StructuredLoggerService,
  ) {}

  async execute(ticketId: string, actor: AuthenticatedUser): Promise<void> {
    await this.tx.execute(async (ctx) => {
      const existing = await ctx.tickets.findByIdForUpdate(ticketId);

      if (!existing) {
        throw new NotFoundException('Ticket not found');
      }

      await ctx.tickets.softDelete(ticketId);

      await ctx.auditLogs.save({
        actorId: actor.id,
        action: AuditAction.DELETE_TICKET,
        entityType: 'ticket',
        entityId: ticketId,
        metadata: {
          title: existing.title,
          status: existing.status,
          requesterId: existing.requesterId,
        },
      });
    });

    await Promise.allSettled([
      this.redis.del(ticketCacheKey(ticketId)).catch((err) => {
        this.logger.warn('cache_del_failed', 'DeleteTicketUseCase', { key: ticketCacheKey(ticketId), error: err?.message });
      }),
      this.redis.invalidateByPattern(`${TICKET_LIST_KEY_PREFIX}:*`).catch((err) => {
        this.logger.warn('cache_invalidate_failed', 'DeleteTicketUseCase', { error: err?.message });
      }),
    ]);
  }
}
