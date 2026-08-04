import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Action } from '../auth/casl/action.enum';
import { can } from '../auth/casl/ability.decorator';
import { CheckPolicies } from '../auth/casl/policy-handler';
import { PoliciesGuard } from '../auth/casl/policies.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MediaAssetResponseDto } from '../common/dto/media-asset-response.dto';
import { ApiPaginatedOkResponse } from '../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UploadMediaDto } from './dto/upload-media.dto';
import { MediaService } from './media.service';

@ApiTags('media')
@ApiBearerAuth('access-token')
@Controller('media-assets')
@UseGuards(PoliciesGuard)
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post()
  @CheckPolicies(can(Action.Create, 'Media'))
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a media asset' })
  @ApiCreatedResponse({ type: MediaAssetResponseDto })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadMediaDto })
  upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @Body() body: UploadMediaDto,
  ) {
    return this.media.upload(file, userId, body.altText);
  }

  @Get()
  @CheckPolicies(can(Action.Read, 'Media'))
  @ApiOperation({ summary: 'List media assets' })
  @ApiPaginatedOkResponse(MediaAssetResponseDto)
  findAll(@Query() query: PaginationQueryDto) {
    return this.media.findAll(query);
  }

  @Get(':id')
  @CheckPolicies(can(Action.Read, 'Media'))
  @ApiOperation({ summary: 'Get a media asset by ID' })
  @ApiOkResponse({ type: MediaAssetResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.media.findOne(id);
  }

  @Delete(':id')
  @HttpCode(204)
  @CheckPolicies(can(Action.Delete, 'Media'))
  @ApiOperation({ summary: 'Delete a media asset' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.media.remove(id);
  }
}
