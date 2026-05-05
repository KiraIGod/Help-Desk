import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AllExceptionsFilter } from './infrastructure/logger/all-exceptions.filter';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { RequestLoggingInterceptor } from './infrastructure/logger/request-logging.interceptor';
import { QueueModule } from './infrastructure/queue/queue.module';
import { RedisThrottlerStorage } from './infrastructure/redis/redis-throttler.storage';
import { RedisModule } from './infrastructure/redis/redis.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    LoggerModule,
    RedisModule,
    QueueModule,

    ThrottlerModule.forRootAsync({
      inject: [RedisThrottlerStorage],
      useFactory: (storage: RedisThrottlerStorage) => ({
        throttlers: [
          { name: 'default', ttl: 60, limit: 100 },
          { name: 'auth', ttl: 60, limit: 10 },
        ],
        storage,
      }),
    }),

    HealthModule,
    AuditModule,
    AuthModule,
    UsersModule,
    TicketsModule,
  ],
  providers: [
    RedisThrottlerStorage,
    { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
