import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';

import { AuditAction } from '../../../audit/domain/enums/audit-action.enum';
import { AuditLogOrmEntity } from '../../../audit/infrastructure/persistence/typeorm/audit-log.orm-entity';
import { AuthenticatedUser } from '../../../auth/domain/types/authenticated-user.type';
import { QueueService } from '../../../../infrastructure/queue/queue.service';
import { RedisService } from '../../../../infrastructure/redis/redis.service';
import { TICKET_LIST_KEY_PREFIX } from '../../../../infrastructure/redis/redis.constants';
import { TicketOrmEntity } from '../../infrastructure/persistence/typeorm/ticket.orm-entity';
import { UpdateTicketStatusDto } from '../dto/update-ticket-status.dto';
import { TicketResponseDto, toTicketResponse } from '../dto/ticket-response.dto';
import { TicketRepository } from '../ports/ticket-repository.port';
import { TICKET_REPOSITORY } from '../ports/ticket-repository.token';
import { ticketCacheKey } from './ticket-cache.util';

@Injectable()
export class ChangeTicketStatusUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly tickets: TicketRepository,
    private readonly dataSource: DataSource,
    private readonly queue: QueueService,
    private readonly redis: RedisService,
  ) {}

  async execute(
    ticketId: string,
    dto: UpdateTicketStatusDto,
    actor: AuthenticatedUser,
  ): Promise<TicketResponseDto> {
    const existing = await this.tickets.findById(ticketId);

    if (!existing) {
      throw new NotFoundException('Ticket not found');
    }

    const now = new Date();
    const resolvedAt = dto.status === 'resolved' ? now : existing.resolvedAt;
    const closedAt =
      dto.status === 'closed' ? now : dto.status === 'resolved' ? null : existing.closedAt;

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(TicketOrmEntity).update(ticketId, {
        status: dto.status,
        resolvedAt,
        closedAt,
        updatedAt: now,
      });

      await manager.getRepository(AuditLogOrmEntity).save(
        manager.getRepository(AuditLogOrmEntity).create({
          id: randomUUID(),
          actorId: actor.id,
          action: AuditAction.CHANGE_TICKET_STATUS,
          entityType: 'ticket',
          entityId: ticketId,
          metadata: {
            previousStatus: existing.status,
            newStatus: dto.status,
          },
          createdAt: now,
        }),
      );
    });

    const updated = await this.tickets.findById(ticketId);
    const response = toTicketResponse(updated!);

    await Promise.all([
      this.redis.set(ticketCacheKey(ticketId), response),
      this.redis.invalidateByPattern(`${TICKET_LIST_KEY_PREFIX}:*`),
      this.queue.sendEmail({
        type: 'ticket_status_updated',
        recipientUserId: existing.requesterId,
        ticketId,
        subject: `Ticket status updated: ${updated!.title}`,
        body: `Status changed from "${existing.status}" to "${dto.status}".`,
      }),
    ]);

    return response;
  }
}
