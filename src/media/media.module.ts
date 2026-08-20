import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AppConfig } from '../config/configuration';
import { MediaFilesController } from './media-files.controller';
import { MediaController } from './media.controller';
import { MediaGarbageCollector } from './media.gc';
import { MediaService } from './media.service';
import { LocalStorageDriver } from './storage/local-storage.driver';
import { RustFsStorageDriver } from './storage/rustfs-storage.driver';
import { STORAGE_DRIVER, StorageDriver } from './storage/storage.driver';

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
  controllers: [MediaController, MediaFilesController],
  providers: [
    {
      provide: STORAGE_DRIVER,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig>): StorageDriver => {
        const media = config.get('media', { infer: true })!;
        return media.driver === 'rustfs'
          ? new RustFsStorageDriver(media.rustfs)
          : new LocalStorageDriver(media.uploadDir);
      },
    },
    MediaService,
    MediaGarbageCollector,
  ],
  exports: [MediaService],
})
export class MediaModule {}
