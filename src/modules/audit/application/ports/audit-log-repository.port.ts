import { CreateAuditLogDto } from '../dto/create-audit-log.dto';
import { AuditLog } from '../../domain/entities/audit-log.entity';

export interface AuditLogRepository {
  create(input: CreateAuditLogDto): Promise<AuditLog>;
  findAll(): Promise<AuditLog[]>;
}
