import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { randomUUID } from 'crypto';

import { EnvironmentVariables } from '../../../../config/environment';
import {
  REFRESH_TOKEN_REPOSITORY,
  USER_AUTH_REPOSITORY,
} from '../ports/auth-repository.tokens';
import {
  RefreshTokenRepository,
  UserAuthRepository,
} from '../ports/auth-repository.port';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { JwtAccessPayload, JwtRefreshPayload } from '../../domain/types/jwt-payload.type';
import { SafeAuthUser } from '../../domain/types/auth-user.type';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_AUTH_REPOSITORY)
    private readonly users: UserAuthRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const email = dto.email.toLowerCase().trim();
    const existingUser = await this.users.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await hash(dto.password, 12);
    const user = await this.users.create({
      email,
      passwordHash,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.users.findByEmail(dto.email.toLowerCase().trim());

    if (!user || user.deletedAt || user.status !== 'active') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const storedToken = await this.refreshTokens.findByTokenId(payload.jti);

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenMatches = await compare(refreshToken, storedToken.tokenHash);

    if (!tokenMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.users.findById(payload.sub);

    if (!user || user.deletedAt || user.status !== 'active') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.refreshTokens.revoke(payload.jti);

    return this.issueTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    const payload = await this.verifyRefreshToken(refreshToken);

    await this.refreshTokens.revoke(payload.jti);
  }

  private async issueTokens(user: SafeAuthUser): Promise<AuthResponseDto> {
    const accessPayload: JwtAccessPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };
    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
      jti: randomUUID(),
      tokenType: 'refresh',
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', { infer: true }),
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', { infer: true }),
      }),
    ]);
    const decodedRefreshToken = this.jwtService.decode(refreshToken);

    if (
      !decodedRefreshToken ||
      typeof decodedRefreshToken === 'string' ||
      typeof decodedRefreshToken.exp !== 'number'
    ) {
      throw new UnauthorizedException('Unable to issue refresh token');
    }

    await this.refreshTokens.save({
      id: randomUUID(),
      tokenId: refreshPayload.jti,
      userId: user.id,
      tokenHash: await hash(refreshToken, 12),
      expiresAt: new Date(decodedRefreshToken.exp * 1000),
      revokedAt: null,
      createdAt: new Date(),
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', { infer: true }),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
      },
    };
  }

  private async verifyRefreshToken(refreshToken: string): Promise<JwtRefreshPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtRefreshPayload>(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
      });

      if (payload.tokenType !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
