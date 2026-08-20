import { PaginationQueryDto } from '../dto/pagination-query.dto';

export interface WhereOptions {
  /** columns matched with case-insensitive `contains` when ?search= is set */
  searchable?: string[];
  /** query keys (enums, ids, booleans) matched by equality when present */
  filterable?: string[];
  /** column that ?dateFrom / ?dateTo apply to */
  dateField?: string;
}

/**
 * A bare `YYYY-MM-DD` upper bound should cover the whole day, otherwise
 * ?dateTo=2026-08-20 would exclude everything after midnight.
 */
function upperBound(value: string): Date {
  const date = new Date(value);
  if (!value.includes('T')) date.setUTCHours(23, 59, 59, 999);
  return date;
}

/**
 * Translates the shared list query params (search, equality filters, date
 * range) into a Prisma `where`. Returns undefined when nothing was requested so
 * callers pass no filter at all.
 */
export function buildWhere<T = any>(
  query: PaginationQueryDto,
  options: WhereOptions,
): T | undefined {
  // Filter keys are declared per module on the subclassed query DTO.
  const values = query as unknown as Record<string, unknown>;
  const conditions: Record<string, unknown>[] = [];

  if (query.search && options.searchable?.length) {
    conditions.push({
      OR: options.searchable.map((field) => ({
        [field]: { contains: query.search, mode: 'insensitive' },
      })),
    });
  }

  for (const key of options.filterable ?? []) {
    const value = values[key];
    if (value !== undefined && value !== null && value !== '') {
      conditions.push({ [key]: value });
    }
  }

  if (options.dateField && (query.dateFrom || query.dateTo)) {
    const range: Record<string, Date> = {};
    if (query.dateFrom) range.gte = new Date(query.dateFrom);
    if (query.dateTo) range.lte = upperBound(query.dateTo);
    conditions.push({ [options.dateField]: range });
  }

  if (!conditions.length) return undefined;
  return (
    conditions.length === 1 ? conditions[0] : { AND: conditions }
  ) as T;
}
