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
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateVisaServiceDto, UpdateVisaServiceDto } from './dto/visa.dto';
import { VisaServiceResponseDto } from './dto/visa-response.dto';
import { VisaService } from './visa.service';

@ApiTags('visa')
@ApiBearerAuth('access-token')
@Controller('visa-services')
@UseGuards(PoliciesGuard)
export class VisaController {
  constructor(private readonly service: VisaService) {}

  @Post()
  @CheckPolicies(can(Action.Create, 'VisaService'))
  @ApiOperation({ summary: 'Create a visa service' })
  @ApiCreatedResponse({ type: VisaServiceResponseDto })
  create(@Body() dto: CreateVisaServiceDto) {
    return this.service.create(dto);
  }

  @Get()
  @CheckPolicies(can(Action.Read, 'VisaService'))
  @ApiOperation({ summary: 'List visa services' })
  @ApiPaginatedOkResponse(VisaServiceResponseDto)
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @CheckPolicies(can(Action.Read, 'VisaService'))
  @ApiOperation({ summary: 'Get a visa service by ID' })
  @ApiOkResponse({ type: VisaServiceResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @CheckPolicies(can(Action.Update, 'VisaService'))
  @ApiOperation({ summary: 'Update a visa service' })
  @ApiOkResponse({ type: VisaServiceResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVisaServiceDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @CheckPolicies(can(Action.Delete, 'VisaService'))
  @ApiOperation({ summary: 'Delete a visa service' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
