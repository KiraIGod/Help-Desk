import { Inject, Injectable } from '@nestjs/common';

import { StructuredLoggerService } from '../../../../infrastructure/logging/structured-logger.service';
import { CreateAuditLogDto } from '../dto/create-audit-log.dto';
import { AuditLogResponseDto, toAuditLogResponse } from '../dto/audit-log-response.dto';
import { AuditLogRepository } from '../ports/audit-log-repository.port';
import { AUDIT_LOG_REPOSITORY } from '../ports/audit-log-repository.token';

@Injectable()
export class AuditService {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogs: AuditLogRepository,
    private readonly logger: StructuredLoggerService,
  ) {}

  async record(input: CreateAuditLogDto): Promise<AuditLogResponseDto> {
    const auditLog = await this.auditLogs.create(input);

    this.logger.log('audit_log_recorded', 'AuditService', {
      auditLogId: auditLog.id,
      actorId: auditLog.actorId,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      metadata: auditLog.metadata,
    });

    return toAuditLogResponse(auditLog);
  }

  async findAll(): Promise<AuditLogResponseDto[]> {
    const logs = await this.auditLogs.findAll();

    return logs.map(toAuditLogResponse);
  }
}
