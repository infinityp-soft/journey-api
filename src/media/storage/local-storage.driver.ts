import { BadRequestException, Logger } from '@nestjs/common';
import { createReadStream, promises as fs } from 'fs';
import * as path from 'path';
import { StorageDriver, StoredObject } from './storage.driver';

const CONTENT_TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

/** Stores images on a mounted volume — the default for local development. */
export class LocalStorageDriver implements StorageDriver {
  private readonly logger = new Logger(LocalStorageDriver.name);
  private readonly root: string;

  constructor(uploadDir: string) {
    this.root = path.resolve(uploadDir);
  }

  async put(key: string, body: Buffer): Promise<void> {
    const abs = this.resolve(key);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    // Atomic write: temp file then rename.
    const tmp = `${abs}.tmp`;
    await fs.writeFile(tmp, body);
    await fs.rename(tmp, abs);
  }

  async get(key: string): Promise<StoredObject | null> {
    const abs = this.resolve(key);
    try {
      const stat = await fs.stat(abs);
      if (!stat.isFile()) return null;
      return {
        stream: createReadStream(abs),
        contentType:
          CONTENT_TYPES[path.extname(abs).toLowerCase()] ??
          'application/octet-stream',
        contentLength: stat.size,
      };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.resolve(key));
    } catch (err) {
      this.logger.warn(`Could not delete file ${key}: ${err}`);
    }
  }

  private resolve(key: string): string {
    const abs = path.resolve(this.root, key);
    if (abs !== this.root && !abs.startsWith(this.root + path.sep)) {
      throw new BadRequestException('Invalid storage key');
    }
    return abs;
  }
}
