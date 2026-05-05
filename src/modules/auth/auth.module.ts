import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EnvironmentVariables } from '../../config/environment';
import { RefreshTokenOrmEntity } from './infrastructure/persistence/typeorm/refresh-token.orm-entity';
import { UserOrmEntity } from '../users/infrastructure/persistence/typeorm/user.orm-entity';
import { TypeOrmRefreshTokenRepository } from './infrastructure/persistence/typeorm-refresh-token.repository';
import { TypeOrmUserAuthRepository } from './infrastructure/persistence/typeorm-user-auth.repository';
import { JwtAccessStrategy } from './infrastructure/strategies/jwt-access.strategy';
import {
  REFRESH_TOKEN_REPOSITORY,
  USER_AUTH_REPOSITORY,
} from './application/ports/auth-repository.tokens';
import { AuthService } from './application/services/auth.service';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { AuthController } from './presentation/auth.controller';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    TypeOrmModule.forFeature([UserOrmEntity, RefreshTokenOrmEntity]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        secret: config.get('JWT_ACCESS_SECRET', { infer: true }),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAccessStrategy,
    JwtAuthGuard,
    {
      provide: USER_AUTH_REPOSITORY,
      useClass: TypeOrmUserAuthRepository,
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: TypeOrmRefreshTokenRepository,
    },
  ],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
