import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RolesGuard } from '../../common/guards/roles.guard';
import { USER_REPOSITORY } from './application/ports/user-repository.token';
import { UsersService } from './application/services/users.service';
import { UserOrmEntity } from './infrastructure/persistence/typeorm/user.orm-entity';
import { TypeOrmUserRepository } from './infrastructure/persistence/typeorm-user.repository';
import { UsersController } from './presentation/users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  controllers: [UsersController],
  providers: [
    UsersService,
    RolesGuard,
    {
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
  ],
  exports: [UsersService, RolesGuard, TypeOrmModule],
})
export class UsersModule {}
