import { Module } from '@nestjs/common';

import { RolesGuard } from '../../common/guards/roles.guard';
import { UsersService } from './application/services/users.service';
import { USER_REPOSITORY } from './application/ports/user-repository.token';
import { InMemoryUserRepository } from './infrastructure/persistence/in-memory-user.repository';
import { UsersController } from './presentation/users.controller';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    RolesGuard,
    {
      provide: USER_REPOSITORY,
      useClass: InMemoryUserRepository,
    },
  ],
  exports: [UsersService, RolesGuard],
})
export class UsersModule {}
