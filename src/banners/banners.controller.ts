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
import { BannerQueryDto } from './dto/banner-query.dto';
import { ReorderDto } from '../common/dto/reorder.dto';
import { BannersService } from './banners.service';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';
import { BannerResponseDto } from './dto/banner-response.dto';

@ApiTags('banners')
@ApiBearerAuth('access-token')
@Controller('banners')
@UseGuards(PoliciesGuard)
export class BannersController {
  constructor(private readonly service: BannersService) {}

  @Post()
  @CheckPolicies(can(Action.Create, 'Banner'))
  @ApiOperation({ summary: 'Create a banner' })
  @ApiCreatedResponse({ type: BannerResponseDto })
  create(@Body() dto: CreateBannerDto) {
    return this.service.create(dto);
  }

  @Get()
  @CheckPolicies(can(Action.Read, 'Banner'))
  @ApiOperation({ summary: 'List banners' })
  @ApiPaginatedOkResponse(BannerResponseDto)
  findAll(@Query() query: BannerQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @CheckPolicies(can(Action.Read, 'Banner'))
  @ApiOperation({ summary: 'Get a banner by ID' })
  @ApiOkResponse({ type: BannerResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch('reorder')
  @HttpCode(204)
  @CheckPolicies(can(Action.Update, 'Banner'))
  @ApiOperation({ summary: 'Reorder banners' })
  @ApiNoContentResponse()
  async reorder(@Body() dto: ReorderDto) {
    await this.service.reorder(dto.items);
  }

  @Patch(':id')
  @CheckPolicies(can(Action.Update, 'Banner'))
  @ApiOperation({ summary: 'Update a banner' })
  @ApiOkResponse({ type: BannerResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBannerDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @CheckPolicies(can(Action.Delete, 'Banner'))
  @ApiOperation({ summary: 'Delete a banner' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
