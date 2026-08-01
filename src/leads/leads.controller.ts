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
import { Public } from '../common/decorators/public.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';
import { LeadsService } from './leads.service';

@ApiTags('leads')
@ApiBearerAuth('access-token')
@Controller('leads')
export class LeadsController {
  constructor(private readonly service: LeadsService) {}

  /** Public lead capture from the marketing website. */
  @Public()
  @Post('submit')
  @ApiOperation({ summary: 'Submit a lead (public)' })
  submit(@Body() dto: CreateLeadDto) {
    return this.service.create(dto);
  }

  @Post()
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Create, 'Lead'))
  @ApiOperation({ summary: 'Create a lead' })
  create(@Body() dto: CreateLeadDto) {
    return this.service.create(dto);
  }

  @Get()
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Read, 'Lead'))
  @ApiOperation({ summary: 'List leads' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Read, 'Lead'))
  @ApiOperation({ summary: 'Get a lead by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Update, 'Lead'))
  @ApiOperation({ summary: 'Update a lead' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLeadDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Delete, 'Lead'))
  @ApiOperation({ summary: 'Delete a lead' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
