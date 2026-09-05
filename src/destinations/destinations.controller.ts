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
import { Public } from '../common/decorators/public.decorator';
import { ApiPaginatedOkResponse } from '../common/dto/paginated-response.dto';
import { DestinationQueryDto } from './dto/destination-query.dto';
import { ReorderDto } from '../common/dto/reorder.dto';
import { DestinationsService } from './destinations.service';
import {
  CreateDestinationDto,
  UpdateDestinationDto,
} from './dto/destination.dto';
import { DestinationResponseDto } from './dto/destination-response.dto';

@ApiTags('destinations')
@ApiBearerAuth('access-token')
@Controller('destinations')
export class DestinationsController {
  constructor(private readonly service: DestinationsService) {}

  /** Published destinations for the marketing website. */
  @Public()
  @Get('public')
  @ApiOperation({ summary: 'List published destinations (public)' })
  @ApiOkResponse({ type: [DestinationResponseDto] })
  findPublic() {
    return this.service.findPublic();
  }

  @Post()
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Create, 'Destination'))
  @ApiOperation({ summary: 'Create a destination' })
  @ApiCreatedResponse({ type: DestinationResponseDto })
  create(@Body() dto: CreateDestinationDto) {
    return this.service.create(dto);
  }

  @Get()
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Read, 'Destination'))
  @ApiOperation({ summary: 'List destinations' })
  @ApiPaginatedOkResponse(DestinationResponseDto)
  findAll(@Query() query: DestinationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Read, 'Destination'))
  @ApiOperation({ summary: 'Get a destination by ID' })
  @ApiOkResponse({ type: DestinationResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch('reorder')
  @HttpCode(204)
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Update, 'Destination'))
  @ApiOperation({ summary: 'Reorder destinations' })
  @ApiNoContentResponse()
  async reorder(@Body() dto: ReorderDto) {
    await this.service.reorder(dto.items);
  }

  @Patch(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Update, 'Destination'))
  @ApiOperation({ summary: 'Update a destination' })
  @ApiOkResponse({ type: DestinationResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDestinationDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Delete, 'Destination'))
  @ApiOperation({ summary: 'Delete a destination' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
