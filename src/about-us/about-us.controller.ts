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
import { AboutUsService } from './about-us.service';
import {
  CreateHighlightDto,
  UpdateAboutUsDto,
  UpdateHighlightDto,
} from './dto/about-us.dto';
import {
  AboutHighlightResponseDto,
  AboutUsResponseDto,
} from './dto/about-us-response.dto';

@ApiTags('about-us')
@ApiBearerAuth('access-token')
@Controller('about-us')
@UseGuards(PoliciesGuard)
export class AboutUsController {
  constructor(private readonly service: AboutUsService) {}

  @Get()
  @CheckPolicies(can(Action.Read, 'AboutUs'))
  @ApiOperation({ summary: 'Get about-us profile' })
  @ApiOkResponse({ type: AboutUsResponseDto })
  getProfile() {
    return this.service.getProfile();
  }

  @Patch()
  @CheckPolicies(can(Action.Update, 'AboutUs'))
  @ApiOperation({ summary: 'Update about-us profile' })
  @ApiOkResponse({ type: AboutUsResponseDto })
  updateProfile(@Body() dto: UpdateAboutUsDto) {
    return this.service.updateProfile(dto);
  }

  @Post('highlights')
  @CheckPolicies(can(Action.Create, 'Highlight'))
  @ApiOperation({ summary: 'Add an about-us highlight' })
  @ApiCreatedResponse({ type: AboutHighlightResponseDto })
  addHighlight(@Body() dto: CreateHighlightDto) {
    return this.service.addHighlight(dto);
  }

  @Patch('highlights/:id')
  @CheckPolicies(can(Action.Update, 'Highlight'))
  @ApiOperation({ summary: 'Update an about-us highlight' })
  @ApiOkResponse({ type: AboutHighlightResponseDto })
  updateHighlight(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHighlightDto,
  ) {
    return this.service.updateHighlight(id, dto);
  }

  @Delete('highlights/:id')
  @HttpCode(204)
  @CheckPolicies(can(Action.Delete, 'Highlight'))
  @ApiOperation({ summary: 'Delete an about-us highlight' })
  @ApiNoContentResponse()
  removeHighlight(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.removeHighlight(id);
  }
}
