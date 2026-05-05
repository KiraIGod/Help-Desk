import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, randomUUID } from 'crypto';
import { Repository } from 'typeorm';

import {
  CreateUserInput,
  UpdateUserInput,
  UserRepository,
} from '../../application/ports/user-repository.port';
import { Role } from '../../domain/entities/role.entity';
import { User } from '../../domain/entities/user.entity';
import { UserRoleName } from '../../domain/value-objects/user-role-name';
import { UserOrmEntity } from './typeorm/user.orm-entity';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) {}

  async create(input: CreateUserInput): Promise<User> {
    const entity = this.repo.create({
      id: randomUUID(),
      email: input.email,
      passwordHash: randomBytes(32).toString('hex'),
      firstName: input.firstName,
      lastName: input.lastName,
      status: 'invited',
      roles: input.roleNames,
      departmentId: input.departmentId ?? null,
    });

    const saved = await this.repo.save(entity);

    return this.toDomain(saved);
  }

  async findAll(): Promise<User[]> {
    const entities = await this.repo.find({
      where: { deletedAt: undefined },
      withDeleted: false,
      order: { createdAt: 'DESC' },
    });

    return entities.map((e) => this.toDomain(e));
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.repo.findOne({ where: { id } });

    return entity ? this.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repo.findOne({
      where: { email: email.toLowerCase() },
    });

    return entity ? this.toDomain(entity) : null;
  }

  async update(id: string, input: UpdateUserInput): Promise<User | null> {
    const entity = await this.repo.findOne({ where: { id } });

    if (!entity) {
      return null;
    }

    Object.assign(entity, {
      firstName: input.firstName?.trim() ?? entity.firstName,
      lastName: input.lastName?.trim() ?? entity.lastName,
      status: input.status ?? entity.status,
      departmentId: input.departmentId === undefined ? entity.departmentId : input.departmentId,
    });

    const saved = await this.repo.save(entity);

    return this.toDomain(saved);
  }

  async assignRoles(id: string, roleNames: UserRoleName[]): Promise<User | null> {
    const entity = await this.repo.findOne({ where: { id } });

    if (!entity) {
      return null;
    }

    entity.roles = roleNames;

    const saved = await this.repo.save(entity);

    return this.toDomain(saved);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  private toDomain(entity: UserOrmEntity): User {
    return new User(
      entity.id,
      entity.email,
      entity.firstName,
      entity.lastName,
      entity.status,
      this.mapRoles(entity.roles),
      entity.departmentId,
      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt,
    );
  }

  private mapRoles(roleNames: UserRoleName[]): Role[] {
    const now = new Date();

    return (roleNames ?? []).map(
      (name) => new Role(randomUUID(), name, null, now, now),
    );
  }
}
