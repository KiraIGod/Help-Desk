import { SetMetadata } from '@nestjs/common';

import { UserRoleName } from '../../modules/users/domain/value-objects/user-role-name';

export const REQUIRED_ROLES = 'requiredRoles';

export const Roles = (...roles: UserRoleName[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(REQUIRED_ROLES, roles);
