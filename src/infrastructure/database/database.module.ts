import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EnvironmentVariables } from '../../config/environment';
import { RefreshTokenOrmEntity } from '../../modules/auth/infrastructure/persistence/typeorm/refresh-token.orm-entity';
import { UserOrmEntity } from '../../modules/users/infrastructure/persistence/typeorm/user.orm-entity';
import { AuditLogOrmEntity } from '../../modules/audit/infrastructure/persistence/typeorm/audit-log.orm-entity';
import { TicketOrmEntity } from '../../modules/tickets/infrastructure/persistence/typeorm/ticket.orm-entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL', { infer: true }),
        entities: [UserOrmEntity, TicketOrmEntity, AuditLogOrmEntity, RefreshTokenOrmEntity],
        synchronize: false,
        ssl:
          config.get('NODE_ENV', { infer: true }) === 'production'
            ? { rejectUnauthorized: false }
            : false,
        logging: config.get('NODE_ENV', { infer: true }) === 'development' ? ['error', 'warn'] : ['error'],
        extra: {
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        },
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
