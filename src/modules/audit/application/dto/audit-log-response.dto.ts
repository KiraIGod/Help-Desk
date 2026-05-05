import { AuditLog } from '../../domain/entities/audit-log.entity';

export interface AuditLogResponseDto {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export const toAuditLogResponse = (log: AuditLog): AuditLogResponseDto => ({
  id: log.id,
  actorId: log.actorId,
  action: log.action,
  entityType: log.entityType,
  entityId: log.entityId,
  metadata: log.metadata,
  createdAt: log.createdAt,
});
