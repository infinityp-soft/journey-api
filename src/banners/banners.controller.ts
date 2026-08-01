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
import { BannersService } from './banners.service';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';

@ApiTags('banners')
@ApiBearerAuth('access-token')
@Controller('banners')
@UseGuards(PoliciesGuard)
export class BannersController {
  constructor(private readonly service: BannersService) {}

  @Post()
  @CheckPolicies(can(Action.Create, 'Banner'))
  @ApiOperation({ summary: 'Create a banner' })
  create(@Body() dto: CreateBannerDto) {
    return this.service.create(dto);
  }

  @Get()
  @CheckPolicies(can(Action.Read, 'Banner'))
  @ApiOperation({ summary: 'List banners' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @CheckPolicies(can(Action.Read, 'Banner'))
  @ApiOperation({ summary: 'Get a banner by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch('reorder')
  @HttpCode(204)
  @CheckPolicies(can(Action.Update, 'Banner'))
  @ApiOperation({ summary: 'Reorder banners' })
  async reorder(@Body() dto: ReorderDto) {
    await this.service.reorder(dto.items);
  }

  @Patch(':id')
  @CheckPolicies(can(Action.Update, 'Banner'))
  @ApiOperation({ summary: 'Update a banner' })
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
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
