import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import {
  TransactionContext,
  TransactionService,
} from '../../common/transaction/transaction.service';
import { AuditLogOrmEntity } from '../../modules/audit/infrastructure/persistence/typeorm/audit-log.orm-entity';
import { TypeOrmAuditLogRepository } from '../../modules/audit/infrastructure/persistence/typeorm-audit-log.repository';
import { TicketOrmEntity } from '../../modules/tickets/infrastructure/persistence/typeorm/ticket.orm-entity';
import { TypeOrmTicketRepository } from '../../modules/tickets/infrastructure/persistence/typeorm-ticket.repository';

@Injectable()
export class TypeOrmTransactionService implements TransactionService {
  constructor(private readonly dataSource: DataSource) {}

  async execute<T>(work: (ctx: TransactionContext) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      const ctx: TransactionContext = {
        tickets: new TypeOrmTicketRepository(manager.getRepository(TicketOrmEntity)),
        auditLogs: new TypeOrmAuditLogRepository(manager.getRepository(AuditLogOrmEntity)),
      };

      return work(ctx);
    });
  }
}
