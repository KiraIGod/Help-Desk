import { User } from '../../domain/entities/user.entity';

export interface UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  roles: string[];
  departmentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const toUserResponse = (user: User): UserResponseDto => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  status: user.status,
  roles: user.roles.filter((role) => !role.deletedAt).map((role) => role.name),
  departmentId: user.departmentId,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
