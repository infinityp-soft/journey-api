import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { can } from '../auth/casl/ability.decorator';
import { Action } from '../auth/casl/action.enum';
import { CheckPolicies } from '../auth/casl/policy-handler';
import { PoliciesGuard } from '../auth/casl/policies.guard';
import { ApiPaginatedOkResponse } from '../common/dto/paginated-response.dto';
import { StaffQueryDto } from './dto/staff-query.dto';
import { ReorderDto } from '../common/dto/reorder.dto';
import { CreateStaffDto, UpdateStaffDto } from './dto/staff.dto';
import { StaffMemberResponseDto } from './dto/staff-response.dto';
import { StaffService } from './staff.service';

@ApiTags('staff')
@ApiBearerAuth('access-token')
@Controller('staff')
@UseGuards(PoliciesGuard)
export class StaffController {
  constructor(private readonly service: StaffService) {}

  @Post()
  @CheckPolicies(can(Action.Create, 'Staff'))
  @ApiOperation({ summary: 'Create a staff member' })
  @ApiCreatedResponse({ type: StaffMemberResponseDto })
  create(@Body() dto: CreateStaffDto) {
    return this.service.create(dto);
  }

  @Get()
  @CheckPolicies(can(Action.Read, 'Staff'))
  @ApiOperation({ summary: 'List staff members' })
  @ApiPaginatedOkResponse(StaffMemberResponseDto)
  findAll(@Query() query: StaffQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @CheckPolicies(can(Action.Read, 'Staff'))
  @ApiOperation({ summary: 'Get a staff member by ID' })
  @ApiOkResponse({ type: StaffMemberResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch('reorder')
  @HttpCode(204)
  @CheckPolicies(can(Action.Update, 'Staff'))
  @ApiOperation({ summary: 'Reorder staff members' })
  @ApiNoContentResponse()
  async reorder(@Body() dto: ReorderDto) {
    await this.service.reorder(dto.items);
  }

  @Patch(':id')
  @CheckPolicies(can(Action.Update, 'Staff'))
  @ApiOperation({ summary: 'Update a staff member' })
  @ApiOkResponse({ type: StaffMemberResponseDto })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStaffDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @CheckPolicies(can(Action.Delete, 'Staff'))
  @ApiOperation({ summary: 'Delete a staff member' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
