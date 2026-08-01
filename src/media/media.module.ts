import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AppConfig } from '../config/configuration';
import { MediaController } from './media.controller';
import { MediaGarbageCollector } from './media.gc';
import { MediaService } from './media.service';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig>) => ({
        storage: memoryStorage(),
        limits: {
          fileSize:
            config.get('media', { infer: true })!.maxUploadMb * 1024 * 1024,
        },
      }),
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService, MediaGarbageCollector],
  exports: [MediaService],
})
export class MediaModule {}
