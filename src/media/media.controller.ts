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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Action } from '../auth/casl/action.enum';
import { can } from '../auth/casl/ability.decorator';
import { CheckPolicies } from '../auth/casl/policy-handler';
import { PoliciesGuard } from '../auth/casl/policies.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
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
  upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @Body('altText') altText?: string,
  ) {
    return this.media.upload(file, userId, altText);
  }

  @Get()
  @CheckPolicies(can(Action.Read, 'Media'))
  @ApiOperation({ summary: 'List media assets' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.media.findAll(query);
  }

  @Get(':id')
  @CheckPolicies(can(Action.Read, 'Media'))
  @ApiOperation({ summary: 'Get a media asset by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.media.findOne(id);
  }

  @Delete(':id')
  @HttpCode(204)
  @CheckPolicies(can(Action.Delete, 'Media'))
  @ApiOperation({ summary: 'Delete a media asset' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.media.remove(id);
  }
}
