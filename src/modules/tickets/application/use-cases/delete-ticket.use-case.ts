import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';

import { AuditAction } from '../../../audit/domain/enums/audit-action.enum';
import { AuditLogOrmEntity } from '../../../audit/infrastructure/persistence/typeorm/audit-log.orm-entity';
import { AuthenticatedUser } from '../../../auth/domain/types/authenticated-user.type';
import { RedisService } from '../../../../infrastructure/redis/redis.service';
import { TICKET_LIST_KEY_PREFIX } from '../../../../infrastructure/redis/redis.constants';
import { TicketOrmEntity } from '../../infrastructure/persistence/typeorm/ticket.orm-entity';
import { TicketRepository } from '../ports/ticket-repository.port';
import { TICKET_REPOSITORY } from '../ports/ticket-repository.token';
import { ticketCacheKey } from './ticket-cache.util';

@Injectable()
export class DeleteTicketUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly tickets: TicketRepository,
    private readonly dataSource: DataSource,
    private readonly redis: RedisService,
  ) {}

  async execute(ticketId: string, actor: AuthenticatedUser): Promise<void> {
    const existing = await this.tickets.findById(ticketId);

    if (!existing) {
      throw new NotFoundException('Ticket not found');
    }

    const now = new Date();

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(TicketOrmEntity).softDelete(ticketId);

      await manager.getRepository(AuditLogOrmEntity).save(
        manager.getRepository(AuditLogOrmEntity).create({
          id: randomUUID(),
          actorId: actor.id,
          action: AuditAction.DELETE_TICKET,
          entityType: 'ticket',
          entityId: ticketId,
          metadata: {
            title: existing.title,
            status: existing.status,
            requesterId: existing.requesterId,
          },
          createdAt: now,
        }),
      );
    });

    await Promise.all([
      this.redis.del(ticketCacheKey(ticketId)),
      this.redis.invalidateByPattern(`${TICKET_LIST_KEY_PREFIX}:*`),
    ]);
  }
}
