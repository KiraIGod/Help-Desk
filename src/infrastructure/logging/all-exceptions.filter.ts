import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';

import { AuthenticatedUser } from '../../modules/auth/domain/types/authenticated-user.type';
import { StructuredLoggerService } from './structured-logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: StructuredLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request & { user?: AuthenticatedUser }>();
    const response = http.getResponse<Response>();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const errorResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const errorId = randomUUID();
    const message = exception instanceof Error ? exception.message : 'Unexpected error';
    const stack = exception instanceof Error ? exception.stack : undefined;

    this.logger.error(message, stack, 'AllExceptionsFilter', {
      errorId,
      method: request.method,
      path: request.originalUrl ?? request.url,
      statusCode,
      userId: request.user?.id,
      ip: request.ip,
      response: errorResponse,
    });

    response.status(statusCode).json({
      statusCode,
      errorId,
      message:
        statusCode === HttpStatus.INTERNAL_SERVER_ERROR ? 'Internal server error' : message,
      timestamp: new Date().toISOString(),
      path: request.originalUrl ?? request.url,
    });
  }
}
