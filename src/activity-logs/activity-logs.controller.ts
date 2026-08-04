import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { can } from '../auth/casl/ability.decorator';
import { Action } from '../auth/casl/action.enum';
import { CheckPolicies } from '../auth/casl/policy-handler';
import { PoliciesGuard } from '../auth/casl/policies.guard';
import { ApiPaginatedOkResponse } from '../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogResponseDto } from './dto/activity-log-response.dto';

@ApiTags('activity-logs')
@ApiBearerAuth('access-token')
@Controller('activity-logs')
@UseGuards(PoliciesGuard)
export class ActivityLogsController {
  constructor(private readonly service: ActivityLogsService) {}

  @Get()
  @CheckPolicies(can(Action.Read, 'ActivityLog'))
  @ApiOperation({ summary: 'List activity logs' })
  @ApiPaginatedOkResponse(ActivityLogResponseDto)
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }
}
