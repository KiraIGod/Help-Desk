import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';

import { CreateAuditLogDto } from '../../application/dto/create-audit-log.dto';
import { AuditLogRepository } from '../../application/ports/audit-log-repository.port';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import { AuditLogOrmEntity } from './typeorm/audit-log.orm-entity';

@Injectable()
export class TypeOrmAuditLogRepository implements AuditLogRepository {
  constructor(
    @InjectRepository(AuditLogOrmEntity)
    private readonly repo: Repository<AuditLogOrmEntity>,
  ) {}

  async save(input: CreateAuditLogDto): Promise<AuditLog> {
    const saved = await this.repo.save(
      this.repo.create({
        id: randomUUID(),
        actorId: input.actorId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata: input.metadata ?? {},
      }),
    );

    return this.toDomain(saved);
  }

  async findAll(): Promise<AuditLog[]> {
    const entities = await this.repo.find({
      order: { createdAt: 'DESC' },
      take: 500,
    });

    return entities.map((e) => this.toDomain(e));
  }

  private toDomain(entity: AuditLogOrmEntity): AuditLog {
    return new AuditLog(
      entity.id,
      entity.actorId,
      entity.action,
      entity.entityType,
      entity.entityId,
      entity.metadata,
      entity.createdAt,
    );
  }
}
