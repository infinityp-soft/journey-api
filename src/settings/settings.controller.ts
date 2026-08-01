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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { can } from '../auth/casl/ability.decorator';
import { Action } from '../auth/casl/action.enum';
import { CheckPolicies } from '../auth/casl/policy-handler';
import { PoliciesGuard } from '../auth/casl/policies.guard';
import {
  CreateSocialLinkDto,
  UpdateSiteSettingsDto,
  UpdateSocialLinkDto,
} from './dto/settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@ApiBearerAuth('access-token')
@Controller('settings')
@UseGuards(PoliciesGuard)
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  @CheckPolicies(can(Action.Read, 'SiteSettings'))
  @ApiOperation({ summary: 'Get site settings' })
  getSettings() {
    return this.service.getSettings();
  }

  @Patch()
  @CheckPolicies(can(Action.Update, 'SiteSettings'))
  @ApiOperation({ summary: 'Update site settings' })
  updateSettings(@Body() dto: UpdateSiteSettingsDto) {
    return this.service.updateSettings(dto);
  }

  @Get('social-links')
  @CheckPolicies(can(Action.Read, 'SocialLink'))
  @ApiOperation({ summary: 'List social links' })
  listSocial() {
    return this.service.listSocialLinks();
  }

  @Post('social-links')
  @CheckPolicies(can(Action.Create, 'SocialLink'))
  @ApiOperation({ summary: 'Create a social link' })
  createSocial(@Body() dto: CreateSocialLinkDto) {
    return this.service.createSocialLink(dto);
  }

  @Patch('social-links/:id')
  @CheckPolicies(can(Action.Update, 'SocialLink'))
  @ApiOperation({ summary: 'Update a social link' })
  updateSocial(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSocialLinkDto,
  ) {
    return this.service.updateSocialLink(id, dto);
  }

  @Delete('social-links/:id')
  @HttpCode(204)
  @CheckPolicies(can(Action.Delete, 'SocialLink'))
  @ApiOperation({ summary: 'Delete a social link' })
  removeSocial(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.removeSocialLink(id);
  }
}
