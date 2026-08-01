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
import {
  CreateVideoDto,
  UpdateVideoDto,
  UpdateVideoPageDto,
} from './dto/video.dto';
import { VideosService } from './videos.service';

@ApiTags('videos')
@ApiBearerAuth('access-token')
@Controller('videos')
@UseGuards(PoliciesGuard)
export class VideosController {
  constructor(private readonly service: VideosService) {}

  // --- Page settings (singleton) ---
  @Get('page-settings')
  @CheckPolicies(can(Action.Read, 'VideoPageSettings'))
  @ApiOperation({ summary: 'Get video page settings' })
  getPage() {
    return this.service.getPageSettings();
  }

  @Patch('page-settings')
  @CheckPolicies(can(Action.Update, 'VideoPageSettings'))
  @ApiOperation({ summary: 'Update video page settings' })
  updatePage(@Body() dto: UpdateVideoPageDto) {
    return this.service.updatePageSettings(dto);
  }

  // --- Videos ---
  @Post()
  @CheckPolicies(can(Action.Create, 'Video'))
  @ApiOperation({ summary: 'Create a video' })
  create(@Body() dto: CreateVideoDto) {
    return this.service.create(dto);
  }

  @Get()
  @CheckPolicies(can(Action.Read, 'Video'))
  @ApiOperation({ summary: 'List videos' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @CheckPolicies(can(Action.Read, 'Video'))
  @ApiOperation({ summary: 'Get a video by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch('reorder')
  @HttpCode(204)
  @CheckPolicies(can(Action.Update, 'Video'))
  @ApiOperation({ summary: 'Reorder videos' })
  async reorder(@Body() dto: ReorderDto) {
    await this.service.reorder(dto.items);
  }

  @Patch(':id')
  @CheckPolicies(can(Action.Update, 'Video'))
  @ApiOperation({ summary: 'Update a video' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVideoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @CheckPolicies(can(Action.Delete, 'Video'))
  @ApiOperation({ summary: 'Delete a video' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
