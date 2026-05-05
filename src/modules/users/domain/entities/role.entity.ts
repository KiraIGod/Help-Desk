import { UserRoleName } from '../value-objects/user-role-name';

export class Role {
  constructor(
    public readonly id: string,
    public readonly name: UserRoleName,
    public readonly description: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null = null,
  ) {}
}
