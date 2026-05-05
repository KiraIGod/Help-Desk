import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AUDIT_LOG_REPOSITORY } from './application/ports/audit-log-repository.token';
import { AuditService } from './application/services/audit.service';
import { AuditLogOrmEntity } from './infrastructure/persistence/typeorm/audit-log.orm-entity';
import { TypeOrmAuditLogRepository } from './infrastructure/persistence/typeorm-audit-log.repository';
import { AuditController } from './presentation/audit.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogOrmEntity])],
  controllers: [AuditController],
  providers: [
    AuditService,
    {
      provide: AUDIT_LOG_REPOSITORY,
      useClass: TypeOrmAuditLogRepository,
    },
  ],
  exports: [AuditService],
})
export class AuditModule {}
