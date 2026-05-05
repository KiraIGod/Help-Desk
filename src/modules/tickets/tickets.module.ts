import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditModule } from '../audit/audit.module';
import { TICKET_REPOSITORY } from './application/ports/ticket-repository.token';
import { TicketsService } from './application/services/tickets.service';
import { AssignTicketUseCase } from './application/use-cases/assign-ticket.use-case';
import { ChangeTicketStatusUseCase } from './application/use-cases/change-ticket-status.use-case';
import { CreateTicketUseCase } from './application/use-cases/create-ticket.use-case';
import { DeleteTicketUseCase } from './application/use-cases/delete-ticket.use-case';
import { UpdateTicketUseCase } from './application/use-cases/update-ticket.use-case';
import { TicketOrmEntity } from './infrastructure/persistence/typeorm/ticket.orm-entity';
import { TypeOrmTicketRepository } from './infrastructure/persistence/typeorm-ticket.repository';
import { TicketsController } from './presentation/tickets.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TicketOrmEntity]),
    AuditModule,
  ],
  controllers: [TicketsController],
  providers: [
    TicketsService,
    RolesGuard,
    CreateTicketUseCase,
    AssignTicketUseCase,
    ChangeTicketStatusUseCase,
    UpdateTicketUseCase,
    DeleteTicketUseCase,
    {
      provide: TICKET_REPOSITORY,
      useClass: TypeOrmTicketRepository,
    },
  ],
  exports: [TicketsService],
})
export class TicketsModule {}
