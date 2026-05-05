import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { CreateAuditLogDto } from '../../application/dto/create-audit-log.dto';
import { AuditLogRepository } from '../../application/ports/audit-log-repository.port';
import { AuditLog } from '../../domain/entities/audit-log.entity';

@Injectable()
export class InMemoryAuditLogRepository implements AuditLogRepository {
  private readonly logs: AuditLog[] = [];

  async save(input: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = new AuditLog(
      randomUUID(),
      input.actorId ?? null,
      input.action,
      input.entityType,
      input.entityId ?? null,
      input.metadata ?? {},
      new Date(),
    );

    this.logs.unshift(auditLog);

    return auditLog;
  }

  async findAll(): Promise<AuditLog[]> {
    return this.logs;
  }
}
