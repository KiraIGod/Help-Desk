import { Module } from '@nestjs/common';

import { RolesGuard } from '../../common/guards/roles.guard';
import { TicketsService } from './application/services/tickets.service';
import { TICKET_REPOSITORY } from './application/ports/ticket-repository.token';
import { InMemoryTicketRepository } from './infrastructure/persistence/in-memory-ticket.repository';
import { TicketsController } from './presentation/tickets.controller';

@Module({
  controllers: [TicketsController],
  providers: [
    TicketsService,
    RolesGuard,
    {
      provide: TICKET_REPOSITORY,
      useClass: InMemoryTicketRepository,
    },
  ],
  exports: [TicketsService],
})
export class TicketsModule {}
