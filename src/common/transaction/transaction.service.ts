import { AuditLogRepository } from '../../modules/audit/application/ports/audit-log-repository.port';
import { TicketRepository } from '../../modules/tickets/application/ports/ticket-repository.port';

export interface TransactionContext {
  tickets: TicketRepository;
  auditLogs: AuditLogRepository;
}

export interface TransactionService {
  execute<T>(work: (ctx: TransactionContext) => Promise<T>): Promise<T>;
}

export const TRANSACTION_SERVICE = Symbol('TRANSACTION_SERVICE');
