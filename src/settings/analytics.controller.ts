import { Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { SettingsService } from '../settings/settings.service';

/**
 * Lightweight public analytics endpoints used by the marketing site.
 * Feeds the Dashboard "Site Visits" card.
 */
@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly settings: SettingsService) {}

  @Public()
  @Post('visit')
  @HttpCode(200)
  @ApiOperation({ summary: 'Increment site visit counter (public)' })
  recordVisit() {
    return this.settings.incrementSiteVisits(1);
  }
}
