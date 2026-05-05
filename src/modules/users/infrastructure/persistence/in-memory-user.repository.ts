import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import {
  CreateUserInput,
  UpdateUserInput,
  UserRepository,
} from '../../application/ports/user-repository.port';
import { Role } from '../../domain/entities/role.entity';
import { User } from '../../domain/entities/user.entity';
import { UserRoleName } from '../../domain/value-objects/user-role-name';

@Injectable()
export class InMemoryUserRepository implements UserRepository {
  private readonly roles = new Map<UserRoleName, Role>([
    [
      'admin',
      new Role(randomUUID(), 'admin', 'Full system access', new Date(), new Date()),
    ],
    [
      'manager',
      new Role(randomUUID(), 'manager', 'Team and workflow management', new Date(), new Date()),
    ],
    [
      'employee',
      new Role(randomUUID(), 'employee', 'Standard HelpDesk user access', new Date(), new Date()),
    ],
  ]);

  private readonly users = new Map<string, User>();

  async create(input: CreateUserInput): Promise<User> {
    const now = new Date();
    const user = new User(
      randomUUID(),
      input.email,
      input.firstName,
      input.lastName,
      'active',
      this.resolveRoles(input.roleNames),
      input.departmentId ?? null,
      now,
      now,
      null,
    );

    this.users.set(user.id, user);

    return user;
  }

  async findAll(): Promise<User[]> {
    return [...this.users.values()].filter((user) => !user.deletedAt);
  }

  async findById(id: string): Promise<User | null> {
    const user = this.users.get(id);

    if (!user || user.deletedAt) {
      return null;
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return (
      [...this.users.values()].find(
        (user) => !user.deletedAt && user.email.toLowerCase() === email.toLowerCase(),
      ) ?? null
    );
  }

  async update(id: string, input: UpdateUserInput): Promise<User | null> {
    const user = await this.findById(id);

    if (!user) {
      return null;
    }

    const updatedUser = new User(
      user.id,
      user.email,
      input.firstName?.trim() ?? user.firstName,
      input.lastName?.trim() ?? user.lastName,
      input.status ?? user.status,
      user.roles,
      input.departmentId === undefined ? user.departmentId : input.departmentId,
      user.createdAt,
      new Date(),
      user.deletedAt,
    );

    this.users.set(id, updatedUser);

    return updatedUser;
  }

  async assignRoles(id: string, roleNames: UserRoleName[]): Promise<User | null> {
    const user = await this.findById(id);

    if (!user) {
      return null;
    }

    const updatedUser = new User(
      user.id,
      user.email,
      user.firstName,
      user.lastName,
      user.status,
      this.resolveRoles(roleNames),
      user.departmentId,
      user.createdAt,
      new Date(),
      user.deletedAt,
    );

    this.users.set(id, updatedUser);

    return updatedUser;
  }

  async softDelete(id: string): Promise<void> {
    const user = await this.findById(id);

    if (!user) {
      return;
    }

    this.users.set(
      id,
      new User(
        user.id,
        user.email,
        user.firstName,
        user.lastName,
        user.status,
        user.roles,
        user.departmentId,
        user.createdAt,
        new Date(),
        new Date(),
      ),
    );
  }

  private resolveRoles(roleNames: UserRoleName[]): Role[] {
    return roleNames.map((roleName) => this.roles.get(roleName)).filter(Boolean) as Role[];
  }
}
