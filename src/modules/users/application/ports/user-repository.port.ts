import { User } from '../../domain/entities/user.entity';
import { UserRoleName } from '../../domain/value-objects/user-role-name';

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  roleNames: UserRoleName[];
  departmentId?: string | null;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  status?: 'active' | 'invited' | 'suspended';
  departmentId?: string | null;
}

export interface UserRepository {
  create(input: CreateUserInput): Promise<User>;
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(id: string, input: UpdateUserInput): Promise<User | null>;
  assignRoles(id: string, roleNames: UserRoleName[]): Promise<User | null>;
  softDelete(id: string): Promise<void>;
}
