import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';

import { UserAuthRepository } from '../../application/ports/auth-repository.port';
import { CreateAuthUser, SafeAuthUser } from '../../domain/types/auth-user.type';
import { UserOrmEntity } from '../../../users/infrastructure/persistence/typeorm/user.orm-entity';

@Injectable()
export class TypeOrmUserAuthRepository implements UserAuthRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) {}

  async create(input: CreateAuthUser): Promise<SafeAuthUser> {
    const entity = this.repo.create({
      id: randomUUID(),
      email: input.email,
      passwordHash: input.passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      status: 'active',
      roles: ['employee'],
      departmentId: null,
    });

    const saved = await this.repo.save(entity);

    return this.toDomain(saved);
  }

  async findByEmail(email: string): Promise<SafeAuthUser | null> {
    const entity = await this.repo
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .andWhere('user.deleted_at IS NULL')
      .getOne();

    return entity ? this.toDomain(entity) : null;
  }

  async findById(id: string): Promise<SafeAuthUser | null> {
    const entity = await this.repo.findOne({ where: { id } });

    return entity ? this.toDomain(entity) : null;
  }

  private toDomain(entity: UserOrmEntity): SafeAuthUser {
    return {
      id: entity.id,
      email: entity.email,
      passwordHash: entity.passwordHash,
      firstName: entity.firstName,
      lastName: entity.lastName,
      roles: entity.roles ?? [],
      status: entity.status,
      deletedAt: entity.deletedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
