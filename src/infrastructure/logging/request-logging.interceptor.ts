import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { AuthenticatedUser } from '../../modules/auth/domain/types/authenticated-user.type';
import { StructuredLoggerService } from './structured-logger.service';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: StructuredLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request & { user?: AuthenticatedUser }>();
    const response = http.getResponse<Response>();
    const startedAt = Date.now();
    const requestId = this.getRequestId(request);

    response.setHeader('x-request-id', requestId);

    return next.handle().pipe(
      finalize(() => {
        this.logger.log('http_request_completed', 'RequestLoggingInterceptor', {
          requestId,
          method: request.method,
          path: request.originalUrl ?? request.url,
          statusCode: response.statusCode,
          durationMs: Date.now() - startedAt,
          userId: request.user?.id,
          ip: request.ip,
          userAgent: request.get('user-agent'),
        });
      }),
    );
  }

  private getRequestId(request: Request): string {
    const requestId = request.get('x-request-id');

    return requestId?.trim() || randomUUID();
  }
}
