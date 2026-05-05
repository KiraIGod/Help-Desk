import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { AppConfigModule } from './config/config.module';
import { CacheInfrastructureModule } from './infrastructure/cache/cache.module';
import { AllExceptionsFilter } from './infrastructure/logging/all-exceptions.filter';
import { LoggingModule } from './infrastructure/logging/logging.module';
import { RequestLoggingInterceptor } from './infrastructure/logging/request-logging.interceptor';
import { QueuesModule } from './infrastructure/queues/queues.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    AppConfigModule,
    LoggingModule,
    CacheInfrastructureModule,
    QueuesModule,
    AuditModule,
    AuthModule,
    UsersModule,
    TicketsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
