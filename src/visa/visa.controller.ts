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
import { VisaQueryDto } from './dto/visa-query.dto';
import { CreateVisaServiceDto, UpdateVisaServiceDto } from './dto/visa.dto';
import { VisaServiceResponseDto } from './dto/visa-response.dto';
import { VisaService } from './visa.service';

@ApiTags('visa')
@ApiBearerAuth('access-token')
@Controller('visa-services')
export class VisaController {
  constructor(private readonly service: VisaService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'List active visa services for the marketing website' })
  @ApiOkResponse({ type: [VisaServiceResponseDto] })
  findPublic() {
    return this.service.findPublic();
  }

  @Post()
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Create, 'VisaService'))
  @ApiOperation({ summary: 'Create a visa service' })
  @ApiCreatedResponse({ type: VisaServiceResponseDto })
  create(@Body() dto: CreateVisaServiceDto) {
    return this.service.create(dto);
  }

  @Get()
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Read, 'VisaService'))
  @ApiOperation({ summary: 'List visa services' })
  @ApiPaginatedOkResponse(VisaServiceResponseDto)
  findAll(@Query() query: VisaQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Read, 'VisaService'))
  @ApiOperation({ summary: 'Get a visa service by ID' })
  @ApiOkResponse({ type: VisaServiceResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(PoliciesGuard)
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
  @UseGuards(PoliciesGuard)
  @HttpCode(204)
  @CheckPolicies(can(Action.Delete, 'VisaService'))
  @ApiOperation({ summary: 'Delete a visa service' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
