import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../auth/domain/types/authenticated-user.type';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { AssignExecutorDto } from '../application/dto/assign-executor.dto';
import { CreateTicketDto } from '../application/dto/create-ticket.dto';
import { FilterTicketsDto } from '../application/dto/filter-tickets.dto';
import { UpdateTicketStatusDto } from '../application/dto/update-ticket-status.dto';
import { UpdateTicketDto } from '../application/dto/update-ticket.dto';
import { TicketsService } from '../application/services/tickets.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Roles('admin', 'manager', 'employee')
  @Post()
  create(@Body() dto: CreateTicketDto, @CurrentUser() user: AuthenticatedUser) {
    return this.ticketsService.create(dto, user);
  }

  @Roles('admin', 'manager', 'employee')
  @Get()
  findAll(@Query() filters: FilterTicketsDto) {
    return this.ticketsService.findAll(filters);
  }

  @Roles('admin', 'manager', 'employee')
  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.findById(id);
  }

  @Roles('admin', 'manager')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketsService.update(id, dto, user);
  }

  @Roles('admin', 'manager')
  @Patch(':id/assign')
  assignExecutor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignExecutorDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketsService.assignExecutor(id, dto, user);
  }

  @Roles('admin', 'manager')
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketsService.updateStatus(id, dto, user);
  }

  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  softDelete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.ticketsService.softDelete(id, user);
  }
}
