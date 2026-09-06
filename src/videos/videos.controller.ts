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
import { VideoQueryDto } from './dto/video-query.dto';
import { ApiPaginatedOkResponse } from '../common/dto/paginated-response.dto';
import { ReorderDto } from '../common/dto/reorder.dto';
import {
  CreateVideoDto,
  UpdateVideoDto,
  UpdateVideoPageDto,
} from './dto/video.dto';
import {
  VideoPageSettingsResponseDto,
  VideoResponseDto,
} from './dto/video-response.dto';
import { VideosService } from './videos.service';

@ApiTags('videos')
@ApiBearerAuth('access-token')
@Controller('videos')
export class VideosController {
  constructor(private readonly service: VideosService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'List published videos for the marketing website' })
  @ApiOkResponse({ type: [VideoResponseDto] })
  findPublic() {
    return this.service.findPublic();
  }

  // --- Page settings (singleton) ---
  @Public()
  @Get('page-settings/public')
  @ApiOperation({ summary: 'Get video page settings for the marketing website' })
  @ApiOkResponse({ type: VideoPageSettingsResponseDto })
  getPagePublic() {
    return this.service.getPageSettings();
  }

  @Get('page-settings')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Read, 'VideoPageSettings'))
  @ApiOperation({ summary: 'Get video page settings' })
  @ApiOkResponse({ type: VideoPageSettingsResponseDto })
  getPage() {
    return this.service.getPageSettings();
  }

  @Patch('page-settings')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Update, 'VideoPageSettings'))
  @ApiOperation({ summary: 'Update video page settings' })
  @ApiOkResponse({ type: VideoPageSettingsResponseDto })
  updatePage(@Body() dto: UpdateVideoPageDto) {
    return this.service.updatePageSettings(dto);
  }

  // --- Videos ---
  @Post()
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Create, 'Video'))
  @ApiOperation({ summary: 'Create a video' })
  @ApiCreatedResponse({ type: VideoResponseDto })
  create(@Body() dto: CreateVideoDto) {
    return this.service.create(dto);
  }

  @Get()
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Read, 'Video'))
  @ApiOperation({ summary: 'List videos' })
  @ApiPaginatedOkResponse(VideoResponseDto)
  findAll(@Query() query: VideoQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Read, 'Video'))
  @ApiOperation({ summary: 'Get a video by ID' })
  @ApiOkResponse({ type: VideoResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch('reorder')
  @UseGuards(PoliciesGuard)
  @HttpCode(204)
  @CheckPolicies(can(Action.Update, 'Video'))
  @ApiOperation({ summary: 'Reorder videos' })
  @ApiNoContentResponse()
  async reorder(@Body() dto: ReorderDto) {
    await this.service.reorder(dto.items);
  }

  @Patch(':id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Update, 'Video'))
  @ApiOperation({ summary: 'Update a video' })
  @ApiOkResponse({ type: VideoResponseDto })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVideoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(PoliciesGuard)
  @HttpCode(204)
  @CheckPolicies(can(Action.Delete, 'Video'))
  @ApiOperation({ summary: 'Delete a video' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
