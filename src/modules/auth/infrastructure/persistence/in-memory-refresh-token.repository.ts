import { Injectable } from '@nestjs/common';

import { RefreshTokenRepository } from '../../application/ports/auth-repository.port';
import { RefreshTokenRecord } from '../../domain/types/auth-user.type';

@Injectable()
export class InMemoryRefreshTokenRepository implements RefreshTokenRepository {
  private readonly refreshTokens = new Map<string, RefreshTokenRecord>();

  async save(token: RefreshTokenRecord): Promise<void> {
    this.refreshTokens.set(token.tokenId, token);
  }

  async findByTokenId(tokenId: string): Promise<RefreshTokenRecord | null> {
    return this.refreshTokens.get(tokenId) ?? null;
  }

  async revoke(tokenId: string): Promise<void> {
    const token = this.refreshTokens.get(tokenId);

    if (!token || token.revokedAt) {
      return;
    }

    this.refreshTokens.set(tokenId, {
      ...token,
      revokedAt: new Date(),
    });
  }
}
