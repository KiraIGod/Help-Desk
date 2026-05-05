import { Controller, Get, UseGuards } from '@nestjs/common';

import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { AuditService } from '../application/services/audit.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Roles('admin', 'manager')
  @Get()
  findAll() {
    return this.auditService.findAll();
  }
}
