import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { can } from '../auth/casl/ability.decorator';
import { Action } from '../auth/casl/action.enum';
import { CheckPolicies } from '../auth/casl/policy-handler';
import { PoliciesGuard } from '../auth/casl/policies.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ActivityLogsService } from './activity-logs.service';

@ApiTags('activity-logs')
@ApiBearerAuth('access-token')
@Controller('activity-logs')
@UseGuards(PoliciesGuard)
export class ActivityLogsController {
  constructor(private readonly service: ActivityLogsService) {}

  @Get()
  @CheckPolicies(can(Action.Read, 'ActivityLog'))
  @ApiOperation({ summary: 'List activity logs' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }
}
