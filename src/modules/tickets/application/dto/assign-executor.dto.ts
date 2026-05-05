import { IsUUID } from 'class-validator';

export class AssignExecutorDto {
  @IsUUID()
  executorId!: string;
}
