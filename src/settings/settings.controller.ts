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
import { Public } from '../common/decorators/public.decorator';
import {
  CreatePreFooterHighlightDto,
  CreateSocialLinkDto,
  UpdatePreFooterHighlightDto,
  UpdateSiteSettingsDto,
  UpdateSocialLinkDto,
} from './dto/settings.dto';
import {
  PreFooterHighlightResponseDto,
  SiteSettingsResponseDto,
  SocialLinkResponseDto,
} from './dto/settings-response.dto';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@ApiBearerAuth('access-token')
@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Get site settings for the marketing website' })
  @ApiOkResponse({ type: SiteSettingsResponseDto })
  getPublic() {
    return this.service.getSettings();
  }

  @Get()
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Read, 'SiteSettings'))
  @ApiOperation({ summary: 'Get site settings' })
  @ApiOkResponse({ type: SiteSettingsResponseDto })
  getSettings() {
    return this.service.getSettings();
  }

  @Patch()
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Update, 'SiteSettings'))
  @ApiOperation({ summary: 'Update site settings' })
  @ApiOkResponse({ type: SiteSettingsResponseDto })
  updateSettings(@Body() dto: UpdateSiteSettingsDto) {
    return this.service.updateSettings(dto);
  }

  @Post('pre-footer-highlights')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Create, 'PreFooterHighlight'))
  @ApiOperation({ summary: 'Add a pre-footer CTA checklist row (max 3)' })
  @ApiCreatedResponse({ type: PreFooterHighlightResponseDto })
  addPreFooterHighlight(@Body() dto: CreatePreFooterHighlightDto) {
    return this.service.addPreFooterHighlight(dto);
  }

  @Patch('pre-footer-highlights/:id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Update, 'PreFooterHighlight'))
  @ApiOperation({ summary: 'Update a pre-footer CTA checklist row' })
  @ApiOkResponse({ type: PreFooterHighlightResponseDto })
  updatePreFooterHighlight(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePreFooterHighlightDto,
  ) {
    return this.service.updatePreFooterHighlight(id, dto);
  }

  @Delete('pre-footer-highlights/:id')
  @UseGuards(PoliciesGuard)
  @HttpCode(204)
  @CheckPolicies(can(Action.Delete, 'PreFooterHighlight'))
  @ApiOperation({ summary: 'Delete a pre-footer CTA checklist row' })
  @ApiNoContentResponse()
  removePreFooterHighlight(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.removePreFooterHighlight(id);
  }

  @Public()
  @Get('social-links/public')
  @ApiOperation({ summary: 'List active social links for the marketing website' })
  @ApiOkResponse({ type: [SocialLinkResponseDto] })
  listSocialPublic() {
    return this.service.findPublicSocialLinks();
  }

  @Get('social-links')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Read, 'SocialLink'))
  @ApiOperation({ summary: 'List social links' })
  @ApiOkResponse({ type: [SocialLinkResponseDto] })
  listSocial() {
    return this.service.listSocialLinks();
  }

  @Post('social-links')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Create, 'SocialLink'))
  @ApiOperation({ summary: 'Create a social link' })
  @ApiCreatedResponse({ type: SocialLinkResponseDto })
  createSocial(@Body() dto: CreateSocialLinkDto) {
    return this.service.createSocialLink(dto);
  }

  @Patch('social-links/:id')
  @UseGuards(PoliciesGuard)
  @CheckPolicies(can(Action.Update, 'SocialLink'))
  @ApiOperation({ summary: 'Update a social link' })
  @ApiOkResponse({ type: SocialLinkResponseDto })
  updateSocial(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSocialLinkDto,
  ) {
    return this.service.updateSocialLink(id, dto);
  }

  @Delete('social-links/:id')
  @UseGuards(PoliciesGuard)
  @HttpCode(204)
  @CheckPolicies(can(Action.Delete, 'SocialLink'))
  @ApiOperation({ summary: 'Delete a social link' })
  @ApiNoContentResponse()
  removeSocial(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.removeSocialLink(id);
  }
}
