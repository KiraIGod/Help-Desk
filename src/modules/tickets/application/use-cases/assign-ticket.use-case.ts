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
import { AssignExecutorDto } from '../dto/assign-executor.dto';
import { TicketResponseDto, toTicketResponse } from '../dto/ticket-response.dto';
import { TicketRepository } from '../ports/ticket-repository.port';
import { TICKET_REPOSITORY } from '../ports/ticket-repository.token';
import { ticketCacheKey } from './ticket-cache.util';

@Injectable()
export class AssignTicketUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly tickets: TicketRepository,
    private readonly dataSource: DataSource,
    private readonly queue: QueueService,
    private readonly redis: RedisService,
  ) {}

  async execute(
    ticketId: string,
    dto: AssignExecutorDto,
    actor: AuthenticatedUser,
  ): Promise<TicketResponseDto> {
    const existing = await this.tickets.findById(ticketId);

    if (!existing) {
      throw new NotFoundException('Ticket not found');
    }

    const now = new Date();
    const newStatus = existing.status === 'open' ? 'in_progress' : existing.status;

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(TicketOrmEntity).update(ticketId, {
        executorId: dto.executorId,
        status: newStatus,
        updatedAt: now,
      });

      await manager.getRepository(AuditLogOrmEntity).save(
        manager.getRepository(AuditLogOrmEntity).create({
          id: randomUUID(),
          actorId: actor.id,
          action: AuditAction.ASSIGN_TICKET,
          entityType: 'ticket',
          entityId: ticketId,
          metadata: {
            executorId: dto.executorId,
            previousExecutorId: existing.executorId,
            statusTransition: existing.status !== newStatus
              ? { from: existing.status, to: newStatus }
              : null,
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
        type: 'ticket_assigned',
        recipientUserId: dto.executorId,
        ticketId,
        subject: `Ticket assigned: ${updated!.title}`,
        body: updated!.description,
      }),
    ]);

    return response;
  }
}
