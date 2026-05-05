import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { EnvironmentVariables } from '../../config/environment';
import { AuthService } from './application/services/auth.service';
import {
  REFRESH_TOKEN_REPOSITORY,
  USER_AUTH_REPOSITORY,
} from './application/ports/auth-repository.tokens';
import { InMemoryRefreshTokenRepository } from './infrastructure/persistence/in-memory-refresh-token.repository';
import { InMemoryUserAuthRepository } from './infrastructure/persistence/in-memory-user-auth.repository';
import { JwtAccessStrategy } from './infrastructure/strategies/jwt-access.strategy';
import { AuthController } from './presentation/auth.controller';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
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
      useClass: InMemoryUserAuthRepository,
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: InMemoryRefreshTokenRepository,
    },
  ],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
