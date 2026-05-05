import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EnvironmentVariables } from '../../config/environment';
import { AuditLogEntry, LogLevel, StructuredLogEntry } from './structured-log-entry.type';

@Injectable()
export class StructuredLoggerService implements LoggerService {
  constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {}

  // ─── Standard NestJS LoggerService interface ─────────────────────────────

  log(message: string, context?: string, metadata?: Record<string, unknown>): void {
    this.write('log', message, context, undefined, metadata);
  }

  error(
    message: string,
    trace?: string,
    context?: string,
    metadata?: Record<string, unknown>,
  ): void {
    this.write('error', message, context, trace, metadata);
  }

  warn(message: string, context?: string, metadata?: Record<string, unknown>): void {
    this.write('warn', message, context, undefined, metadata);
  }

  debug(message: string, context?: string, metadata?: Record<string, unknown>): void {
    if (this.isDebugEnabled()) {
      this.write('debug', message, context, undefined, metadata);
    }
  }

  verbose(message: string, context?: string, metadata?: Record<string, unknown>): void {
    if (this.isDebugEnabled()) {
      this.write('verbose', message, context, undefined, metadata);
    }
  }

  // ─── Audit-specific stream ───────────────────────────────────────────────

  /**
   * Writes a structured audit event to a dedicated stream (stdout with `audit` level).
   * In production, ship this stream separately to a compliance sink (ELK, CloudWatch, etc.).
   */
  audit(
    action: string,
    actorId: string | null,
    entityType: string,
    entityId: string | null,
    metadata?: Record<string, unknown>,
  ): void {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      actorId,
      action,
      entityType,
      entityId,
      metadata,
    };

    process.stdout.write(`${JSON.stringify({ level: 'audit', ...entry })}\n`);
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private write(
    level: LogLevel,
    message: string,
    context?: string,
    trace?: string,
    metadata?: Record<string, unknown>,
  ): void {
    const entry: StructuredLogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      trace,
      metadata,
    };

    const output = JSON.stringify(entry);

    if (level === 'error') {
      process.stderr.write(`${output}\n`);
      return;
    }

    process.stdout.write(`${output}\n`);
  }

  private isDebugEnabled(): boolean {
    const level = this.config.get('LOG_LEVEL', { infer: true });

    return level === 'debug' || level === 'trace';
  }
}
