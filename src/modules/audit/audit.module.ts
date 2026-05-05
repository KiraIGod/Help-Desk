import { Module } from '@nestjs/common';

import { AuditService } from './application/services/audit.service';
import { AUDIT_LOG_REPOSITORY } from './application/ports/audit-log-repository.token';
import { InMemoryAuditLogRepository } from './infrastructure/persistence/in-memory-audit-log.repository';
import { AuditController } from './presentation/audit.controller';

@Module({
  controllers: [AuditController],
  providers: [
    AuditService,
    {
      provide: AUDIT_LOG_REPOSITORY,
      useClass: InMemoryAuditLogRepository,
    },
  ],
  exports: [AuditService],
})
export class AuditModule {}
