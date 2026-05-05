import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { TRANSACTION_SERVICE, TransactionService } from '../../../../common/transaction/transaction.service';
import { AuditAction } from '../../../audit/domain/enums/audit-action.enum';
import { AuthenticatedUser } from '../../../auth/domain/types/authenticated-user.type';
import { RedisService } from '../../../../infrastructure/redis/redis.service';
import { TICKET_LIST_KEY_PREFIX } from '../../../../infrastructure/redis/redis.constants';
import { StructuredLoggerService } from '../../../../infrastructure/logger/structured-logger.service';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { TicketResponseDto, toTicketResponse } from '../dto/ticket-response.dto';
import { ticketCacheKey } from './ticket-cache.util';

@Injectable()
export class UpdateTicketUseCase {
  constructor(
    @Inject(TRANSACTION_SERVICE)
    private readonly tx: TransactionService,
    private readonly redis: RedisService,
    private readonly logger: StructuredLoggerService,
  ) {}

  async execute(
    ticketId: string,
    dto: UpdateTicketDto,
    actor: AuthenticatedUser,
  ): Promise<TicketResponseDto> {
    const changedFields = (Object.keys(dto) as (keyof UpdateTicketDto)[]).filter(
      (key) => dto[key] !== undefined,
    );

    const ticket = await this.tx.execute(async (ctx) => {
      const existing = await ctx.tickets.findByIdForUpdate(ticketId);

      if (!existing) {
        throw new NotFoundException('Ticket not found');
      }

      const updated = existing.updateDetails({
        title: dto.title?.trim(),
        description: dto.description?.trim(),
        priority: dto.priority,
        deadlineAt: dto.deadlineAt !== undefined
          ? (dto.deadlineAt ? new Date(dto.deadlineAt) : null)
          : undefined,
      });

      const saved = await ctx.tickets.save(updated);

      await ctx.auditLogs.save({
        actorId: actor.id,
        action: AuditAction.UPDATE_TICKET,
        entityType: 'ticket',
        entityId: ticketId,
        metadata: { changedFields },
      });

      return saved;
    });

    const response = toTicketResponse(ticket);

    await Promise.allSettled([
      this.redis.set(ticketCacheKey(ticketId), response).catch((err) => {
        this.logger.warn('cache_set_failed', 'UpdateTicketUseCase', { key: ticketCacheKey(ticketId), error: err?.message });
      }),
      this.redis.invalidateByPattern(`${TICKET_LIST_KEY_PREFIX}:*`).catch((err) => {
        this.logger.warn('cache_invalidate_failed', 'UpdateTicketUseCase', { error: err?.message });
      }),
    ]);

    return response;
  }
}
