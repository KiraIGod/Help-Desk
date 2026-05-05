import { IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsIn(['active', 'invited', 'suspended'])
  status?: 'active' | 'invited' | 'suspended';

  @IsOptional()
  @IsUUID()
  departmentId?: string;
}
