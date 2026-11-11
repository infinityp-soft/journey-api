import { Controller, HttpCode, Post } from '@nestjs/common';
import { RateLimit } from '../common/rate-limit/rate-limit.guard';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SiteVisitsResponseDto } from './dto/analytics-response.dto';
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
  @RateLimit({ limit: 60, windowSec: 60 * 60, overall: { limit: 5000, windowSec: 60 * 60 } })
  @Post('visit')
  @HttpCode(200)
  @ApiOperation({ summary: 'Increment site visit counter (public)' })
  @ApiOkResponse({ type: SiteVisitsResponseDto })
  recordVisit() {
    return this.settings.incrementSiteVisits(1);
  }
}
