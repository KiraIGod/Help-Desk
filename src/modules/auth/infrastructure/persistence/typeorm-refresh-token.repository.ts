import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RefreshTokenRepository } from '../../application/ports/auth-repository.port';
import { RefreshTokenRecord } from '../../domain/types/auth-user.type';
import { RefreshTokenOrmEntity } from './typeorm/refresh-token.orm-entity';

@Injectable()
export class TypeOrmRefreshTokenRepository implements RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenOrmEntity)
    private readonly repo: Repository<RefreshTokenOrmEntity>,
  ) {}

  async save(token: RefreshTokenRecord): Promise<void> {
    await this.repo.insert({
      id: token.id,
      tokenId: token.tokenId,
      userId: token.userId,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt,
      revokedAt: token.revokedAt,
    });
  }

  async findByTokenId(tokenId: string): Promise<RefreshTokenRecord | null> {
    const entity = await this.repo.findOne({ where: { tokenId } });

    return entity ? this.toDomain(entity) : null;
  }

  async revoke(tokenId: string): Promise<void> {
    await this.repo.update({ tokenId }, { revokedAt: new Date() });
  }

  private toDomain(entity: RefreshTokenOrmEntity): RefreshTokenRecord {
    return {
      id: entity.id,
      tokenId: entity.tokenId,
      userId: entity.userId,
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt,
      revokedAt: entity.revokedAt,
      createdAt: entity.createdAt,
    };
  }
}
