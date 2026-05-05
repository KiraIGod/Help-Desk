export type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose';

export interface StructuredLogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  trace?: string;
  metadata?: Record<string, unknown>;
}
