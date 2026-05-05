export type UserStatus = 'active' | 'invited' | 'suspended';

export interface SafeAuthUser {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  roles: string[];
  status: UserStatus;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAuthUser {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
}

export interface RefreshTokenRecord {
  id: string;
  tokenId: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}
