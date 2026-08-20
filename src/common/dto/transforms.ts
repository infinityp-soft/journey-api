import { Transform } from 'class-transformer';

/**
 * Query strings carry booleans as `'true'` / `'false'`. The global
 * ValidationPipe runs with `enableImplicitConversion`, which would coerce them
 * with `Boolean(value)` and turn `'false'` into `true`, so read the raw value
 * off the source object instead of the already-converted one.
 */
export function ToBoolean(): PropertyDecorator {
  return Transform(({ obj, key }) => {
    const raw = (obj as Record<string, unknown>)?.[key];
    if (raw === undefined || raw === null || raw === '') return undefined;
    if (raw === true || raw === 'true' || raw === '1') return true;
    if (raw === false || raw === 'false' || raw === '0') return false;
    return raw;
  });
}
