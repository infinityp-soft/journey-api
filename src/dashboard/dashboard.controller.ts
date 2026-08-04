import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DashboardSummaryResponseDto } from './dto/dashboard-response.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  /** Any authenticated user can view the dashboard overview. */
  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary' })
  @ApiOkResponse({ type: DashboardSummaryResponseDto })
  summary() {
    return this.service.summary();
  }
}
