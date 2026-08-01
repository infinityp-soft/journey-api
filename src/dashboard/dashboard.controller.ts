import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  /** Any authenticated user can view the dashboard overview. */
  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary' })
  summary() {
    return this.service.summary();
  }
}
