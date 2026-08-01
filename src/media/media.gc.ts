import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MediaService } from './media.service';

/** Nightly cleanup of unreferenced media files/rows. */
@Injectable()
export class MediaGarbageCollector {
  private readonly logger = new Logger(MediaGarbageCollector.name);

  constructor(private readonly media: MediaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCron() {
    try {
      const count = await this.media.purgeUnreferenced();
      if (count > 0) this.logger.log(`GC removed ${count} media asset(s)`);
    } catch (err) {
      this.logger.error(`Media GC failed: ${err}`);
    }
  }
}
