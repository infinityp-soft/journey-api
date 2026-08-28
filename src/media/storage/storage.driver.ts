import { Readable } from 'stream';

export const STORAGE_DRIVER = Symbol('STORAGE_DRIVER');

export interface StoredObject {
  stream: Readable;
  contentType: string;
  contentLength?: number;
}

/**
 * Backing store for uploaded images. Keys are `media_assets.storage_key`
 * values (`yyyy/mm/dd/{uuid}.webp`) — always relative, never absolute paths.
 */
export interface StorageDriver {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  /** Resolves to `null` when the key does not exist. */
  get(key: string): Promise<StoredObject | null>;
  /** Best-effort: a missing key is not an error. */
  delete(key: string): Promise<void>;
}
