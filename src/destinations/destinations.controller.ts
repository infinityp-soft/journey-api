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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { can } from '../auth/casl/ability.decorator';
import { Action } from '../auth/casl/action.enum';
import { CheckPolicies } from '../auth/casl/policy-handler';
import { PoliciesGuard } from '../auth/casl/policies.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ReorderDto } from '../common/dto/reorder.dto';
import { DestinationsService } from './destinations.service';
import {
  CreateDestinationDto,
  UpdateDestinationDto,
} from './dto/destination.dto';

@ApiTags('destinations')
@ApiBearerAuth('access-token')
@Controller('destinations')
@UseGuards(PoliciesGuard)
export class DestinationsController {
  constructor(private readonly service: DestinationsService) {}

  @Post()
  @CheckPolicies(can(Action.Create, 'Destination'))
  @ApiOperation({ summary: 'Create a destination' })
  create(@Body() dto: CreateDestinationDto) {
    return this.service.create(dto);
  }

  @Get()
  @CheckPolicies(can(Action.Read, 'Destination'))
  @ApiOperation({ summary: 'List destinations' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @CheckPolicies(can(Action.Read, 'Destination'))
  @ApiOperation({ summary: 'Get a destination by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch('reorder')
  @HttpCode(204)
  @CheckPolicies(can(Action.Update, 'Destination'))
  @ApiOperation({ summary: 'Reorder destinations' })
  async reorder(@Body() dto: ReorderDto) {
    await this.service.reorder(dto.items);
  }

  @Patch(':id')
  @CheckPolicies(can(Action.Update, 'Destination'))
  @ApiOperation({ summary: 'Update a destination' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDestinationDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @CheckPolicies(can(Action.Delete, 'Destination'))
  @ApiOperation({ summary: 'Delete a destination' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
