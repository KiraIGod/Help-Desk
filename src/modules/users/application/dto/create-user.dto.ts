import { ArrayNotEmpty, IsArray, IsEmail, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

import { USER_ROLES, UserRoleName } from '../../domain/value-objects/user-role-name';

export class CreateUserDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsIn(USER_ROLES, { each: true })
  roles!: UserRoleName[];

  @IsOptional()
  @IsUUID()
  departmentId?: string;
}
