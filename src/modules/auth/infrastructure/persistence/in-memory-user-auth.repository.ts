import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { UserAuthRepository } from '../../application/ports/auth-repository.port';
import { CreateAuthUser, SafeAuthUser } from '../../domain/types/auth-user.type';

@Injectable()
export class InMemoryUserAuthRepository implements UserAuthRepository {
  private readonly users = new Map<string, SafeAuthUser>();

  async create(input: CreateAuthUser): Promise<SafeAuthUser> {
    const now = new Date();
    const user: SafeAuthUser = {
      id: randomUUID(),
      email: input.email,
      passwordHash: input.passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      roles: ['user'],
      status: 'active',
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(user.id, user);

    return user;
  }

  async findByEmail(email: string): Promise<SafeAuthUser | null> {
    return (
      [...this.users.values()].find(
        (user) => user.email.toLowerCase() === email.toLowerCase(),
      ) ?? null
    );
  }

  async findById(id: string): Promise<SafeAuthUser | null> {
    return this.users.get(id) ?? null;
  }
}
