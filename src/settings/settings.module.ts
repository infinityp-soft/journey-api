import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  controllers: [SettingsController, AnalyticsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
