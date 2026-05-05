import {
  CreateAuthUser,
  RefreshTokenRecord,
  SafeAuthUser,
} from '../../domain/types/auth-user.type';

export interface UserAuthRepository {
  create(input: CreateAuthUser): Promise<SafeAuthUser>;
  findByEmail(email: string): Promise<SafeAuthUser | null>;
  findById(id: string): Promise<SafeAuthUser | null>;
}

export interface RefreshTokenRepository {
  save(token: RefreshTokenRecord): Promise<void>;
  findByTokenId(tokenId: string): Promise<RefreshTokenRecord | null>;
  revoke(tokenId: string): Promise<void>;
}
