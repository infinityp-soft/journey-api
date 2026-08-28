import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { STORAGE_DRIVER, StorageDriver } from './storage/storage.driver';

/** Storage keys this API generates; anything else is a probe or an attack. */
const SAFE_KEY = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

/**
 * Serves uploaded images at `PUBLIC_MEDIA_URL` (`/media/...`) from whichever
 * driver is configured, so the URL stored in a response never depends on where
 * the bytes actually live.
 */
@ApiExcludeController()
@Controller('media')
export class MediaFilesController {
  constructor(
    @Inject(STORAGE_DRIVER) private readonly storage: StorageDriver,
  ) {}

  @Public()
  @Get('*')
  async serve(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const key = req.params['0'] ?? '';
    if (!SAFE_KEY.test(key) || key.includes('..')) {
      throw new NotFoundException('File not found');
    }

    const object = await this.storage.get(key);
    if (!object) throw new NotFoundException('File not found');

    res.set({
      'Content-Type': object.contentType,
      // Keys embed a UUID, so bytes behind a URL never change.
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    if (object.contentLength !== undefined) {
      res.set('Content-Length', String(object.contentLength));
    }

    return new StreamableFile(object.stream);
  }
}
