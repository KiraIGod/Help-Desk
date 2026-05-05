import { ArrayNotEmpty, IsArray, IsIn } from 'class-validator';

import { USER_ROLES, UserRoleName } from '../../domain/value-objects/user-role-name';

export class AssignRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(USER_ROLES, { each: true })
  roles!: UserRoleName[];
}
