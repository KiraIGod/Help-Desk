export type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose';

export interface StructuredLogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  trace?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLogEntry {
  timestamp: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata?: Record<string, unknown>;
}
