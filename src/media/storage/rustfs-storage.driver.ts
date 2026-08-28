import { Logger } from '@nestjs/common';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { RustFsConfig } from '../../config/configuration';
import { StorageDriver, StoredObject } from './storage.driver';

/**
 * RustFS is S3-compatible, so this talks plain S3 through the AWS SDK.
 * Objects are written without an ACL: RustFS answers `public-read` with
 * InvalidArgument, and anonymous access belongs in a bucket policy anyway.
 */
export class RustFsStorageDriver implements StorageDriver {
  private readonly logger = new Logger(RustFsStorageDriver.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private bucketReady?: Promise<void>;

  constructor(config: RustFsConfig) {
    if (!config.accessKey || !config.secretKey) {
      throw new Error(
        'RUSTFS_ACCESS_KEY and RUSTFS_SECRET_KEY are required when MEDIA_DRIVER=rustfs',
      );
    }
    this.bucket = config.bucket;
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      forcePathStyle: config.forcePathStyle,
    });
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.ensureBucket();
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        // Every key embeds a fresh UUID, so an object is never overwritten.
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
  }

  async get(key: string): Promise<StoredObject | null> {
    try {
      const res = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return {
        stream: res.Body as Readable,
        contentType: res.ContentType ?? 'application/octet-stream',
        contentLength: res.ContentLength,
      };
    } catch (err) {
      if (isNotFound(err)) return null;
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (err) {
      this.logger.warn(`Could not delete object ${key}: ${err}`);
    }
  }

  /**
   * Runs on the first write rather than at boot, so the API starts even when
   * RustFS is not reachable yet. A failure is not cached — the next upload
   * retries.
   */
  private ensureBucket(): Promise<void> {
    this.bucketReady ??= this.createBucketIfMissing().catch((err: unknown) => {
      this.bucketReady = undefined;
      throw err;
    });
    return this.bucketReady;
  }

  private async createBucketIfMissing(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return;
    } catch (err) {
      if (!isNotFound(err)) throw err;
    }

    try {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Created RustFS bucket "${this.bucket}"`);
    } catch (err) {
      const name = (err as S3ServiceException)?.name;
      if (
        name !== 'BucketAlreadyOwnedByYou' &&
        name !== 'BucketAlreadyExists'
      ) {
        throw err;
      }
    }
  }
}

function isNotFound(err: unknown): boolean {
  const e = err as S3ServiceException;
  return (
    e?.name === 'NotFound' ||
    e?.name === 'NoSuchKey' ||
    e?.name === 'NoSuchBucket' ||
    e?.$metadata?.httpStatusCode === 404
  );
}
