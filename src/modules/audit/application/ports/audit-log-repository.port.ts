import { AuditLog } from '../../domain/entities/audit-log.entity';
import { CreateAuditLogDto } from '../dto/create-audit-log.dto';

export interface AuditLogRepository {
  save(input: CreateAuditLogDto): Promise<AuditLog>;
  findAll(): Promise<AuditLog[]>;
}
