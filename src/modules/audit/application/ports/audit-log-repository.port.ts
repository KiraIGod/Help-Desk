import { EntityManager } from 'typeorm';

import { AuditLog } from '../../domain/entities/audit-log.entity';
import { CreateAuditLogDto } from '../dto/create-audit-log.dto';

export interface AuditLogRepository {
  /**
   * Persist an audit log entry.
   * When `manager` is provided the insert runs inside the caller's transaction.
   */
  create(input: CreateAuditLogDto, manager?: EntityManager): Promise<AuditLog>;
  findAll(): Promise<AuditLog[]>;
}
