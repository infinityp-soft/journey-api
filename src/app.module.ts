import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { resolve } from 'path';
import { AboutUsModule } from './about-us/about-us.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { ArticlesModule } from './articles/articles.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { BannersModule } from './banners/banners.module';
import { MediaUrlInterceptor } from './common/interceptors/media-url.interceptor';
import { ActivityLogInterceptor } from './common/interceptors/activity-log.interceptor';
import configuration, { AppConfig } from './config/configuration';
import { DashboardModule } from './dashboard/dashboard.module';
import { DestinationsModule } from './destinations/destinations.module';
import { EventsModule } from './events/events.module';
import { LeadsModule } from './leads/leads.module';
import { MediaModule } from './media/media.module';
import { PrismaModule } from './prisma/prisma.module';
import { SettingsModule } from './settings/settings.module';
import { StaffModule } from './staff/staff.module';
import { TestimonialsModule } from './testimonials/testimonials.module';
import { UsersModule } from './users/users.module';
import { VideosModule } from './videos/videos.module';
import { VisaModule } from './visa/visa.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig>) => [
        {
          rootPath: resolve(config.get('media', { infer: true })!.uploadDir),
          serveRoot: '/media',
        },
      ],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    MediaModule,
    ActivityLogsModule,
    DashboardModule,
    BannersModule,
    AboutUsModule,
    StaffModule,
    DestinationsModule,
    ArticlesModule,
    VisaModule,
    TestimonialsModule,
    VideosModule,
    EventsModule,
    LeadsModule,
    SettingsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: MediaUrlInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ActivityLogInterceptor },
  ],
})
export class AppModule {}
