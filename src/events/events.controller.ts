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
import {
  CreateEventDto,
  CreateEventRegistrationDto,
  UpdateEventDto,
} from './dto/event.dto';
import { EventsService } from './events.service';

@ApiTags('events')
@ApiBearerAuth('access-token')
@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}

  @Post()
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Create, 'Event'))
  @ApiOperation({ summary: 'Create an event' })
  create(@Body() dto: CreateEventDto) {
    return this.service.create(dto);
  }

  @Get()
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Read, 'Event'))
  @ApiOperation({ summary: 'List events' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Read, 'Event'))
  @ApiOperation({ summary: 'Get an event by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Update, 'Event'))
  @ApiOperation({ summary: 'Update an event' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEventDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Delete, 'Event'))
  @ApiOperation({ summary: 'Delete an event' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  // --- Registrations ---
  @Get(':id/registrations')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Read, 'EventRegistration'))
  @ApiOperation({ summary: 'List event registrations' })
  listRegistrations(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.listRegistrations(id, query);
  }

  /** Public registration from the marketing website. */
  @Public()
  @Post(':id/registrations')
  @ApiOperation({ summary: 'Register for an event (public)' })
  register(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateEventRegistrationDto,
  ) {
    return this.service.register(id, dto);
  }

  @Delete(':id/registrations/:regId')
  @HttpCode(204)
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Delete, 'EventRegistration'))
  @ApiOperation({ summary: 'Delete an event registration' })
  removeRegistration(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('regId', ParseUUIDPipe) regId: string,
  ) {
    return this.service.removeRegistration(id, regId);
  }
}
