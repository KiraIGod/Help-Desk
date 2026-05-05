import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { AssignRolesDto } from '../dto/assign-roles.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { toUserResponse, UserResponseDto } from '../dto/user-response.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserRepository } from '../ports/user-repository.port';
import { USER_REPOSITORY } from '../ports/user-repository.token';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const email = dto.email.toLowerCase().trim();
    const existingUser = await this.users.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const user = await this.users.create({
      email,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      roleNames: dto.roles,
      departmentId: dto.departmentId ?? null,
    });

    return toUserResponse(user);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.users.findAll();

    return users.map(toUserResponse);
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.users.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return toUserResponse(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.users.update(id, dto);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return toUserResponse(user);
  }

  async assignRoles(id: string, dto: AssignRolesDto): Promise<UserResponseDto> {
    const user = await this.users.assignRoles(id, dto.roles);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return toUserResponse(user);
  }

  async softDelete(id: string): Promise<void> {
    await this.findById(id);
    await this.users.softDelete(id);
  }
}
