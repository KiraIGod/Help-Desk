import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';

import { AuditAction } from '../../../audit/domain/enums/audit-action.enum';
import { AuditLogOrmEntity } from '../../../audit/infrastructure/persistence/typeorm/audit-log.orm-entity';
import { AuthenticatedUser } from '../../../auth/domain/types/authenticated-user.type';
import { RedisService } from '../../../../infrastructure/redis/redis.service';
import { TICKET_LIST_KEY_PREFIX } from '../../../../infrastructure/redis/redis.constants';
import { TicketOrmEntity } from '../../infrastructure/persistence/typeorm/ticket.orm-entity';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { TicketResponseDto, toTicketResponse } from '../dto/ticket-response.dto';
import { TicketRepository } from '../ports/ticket-repository.port';
import { TICKET_REPOSITORY } from '../ports/ticket-repository.token';
import { ticketCacheKey } from './ticket-cache.util';

@Injectable()
export class UpdateTicketUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly tickets: TicketRepository,
    private readonly dataSource: DataSource,
    private readonly redis: RedisService,
  ) {}

  async execute(
    ticketId: string,
    dto: UpdateTicketDto,
    actor: AuthenticatedUser,
  ): Promise<TicketResponseDto> {
    const existing = await this.tickets.findById(ticketId);

    if (!existing) {
      throw new NotFoundException('Ticket not found');
    }

    const now = new Date();
    const changedFields = Object.keys(dto).filter(
      (key) => dto[key as keyof UpdateTicketDto] !== undefined,
    );

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(TicketOrmEntity).update(ticketId, {
        title: dto.title?.trim() ?? existing.title,
        description: dto.description?.trim() ?? existing.description,
        priority: dto.priority ?? existing.priority,
        deadlineAt:
          dto.deadlineAt !== undefined ? new Date(dto.deadlineAt!) : existing.deadlineAt,
        updatedAt: now,
      });

      await manager.getRepository(AuditLogOrmEntity).save(
        manager.getRepository(AuditLogOrmEntity).create({
          id: randomUUID(),
          actorId: actor.id,
          action: AuditAction.UPDATE_TICKET,
          entityType: 'ticket',
          entityId: ticketId,
          metadata: { changedFields },
          createdAt: now,
        }),
      );
    });

    const updated = await this.tickets.findById(ticketId);
    const response = toTicketResponse(updated!);

    await Promise.all([
      this.redis.set(ticketCacheKey(ticketId), response),
      this.redis.invalidateByPattern(`${TICKET_LIST_KEY_PREFIX}:*`),
    ]);

    return response;
  }
}
