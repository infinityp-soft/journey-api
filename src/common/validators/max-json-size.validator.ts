import { registerDecorator, ValidationOptions } from 'class-validator';

/**
 * Rejects objects whose JSON form is larger than `maxBytes` or that have more
 * than `maxKeys` top-level keys — keeps public payloads (event registration
 * answers) from storing arbitrarily large blobs.
 */
export function MaxJsonSize(
  maxBytes: number,
  maxKeys = 100,
  options?: ValidationOptions,
) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'maxJsonSize',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} is too large (max ${maxBytes} bytes, ${maxKeys} keys)`,
        ...options,
      },
      validator: {
        validate(value: unknown) {
          if (value == null) return true;
          if (typeof value !== 'object') return false;
          if (Object.keys(value).length > maxKeys) return false;
          return Buffer.byteLength(JSON.stringify(value), 'utf8') <= maxBytes;
        },
      },
    });
}
