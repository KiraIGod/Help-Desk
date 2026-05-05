import { Role } from './role.entity';

export type UserStatus = 'active' | 'invited' | 'suspended';

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly status: UserStatus,
    public readonly roles: Role[],
    public readonly departmentId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null = null,
  ) {}

  hasRole(roleName: string): boolean {
    return this.roles.some((role) => role.name === roleName && !role.deletedAt);
  }
}
