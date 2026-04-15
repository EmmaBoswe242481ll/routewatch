import { RouteChange } from '../diff/types';

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function paginate<T>(
  items: T[],
  options: PaginationOptions
): PaginatedResult<T> {
  const { page, pageSize } = options;

  if (page < 1) throw new Error('page must be >= 1');
  if (pageSize < 1) throw new Error('pageSize must be >= 1');

  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    items: items.slice(start, end),
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export function paginateChanges(
  changes: RouteChange[],
  options: PaginationOptions
): PaginatedResult<RouteChange> {
  return paginate(changes, options);
}

export function formatPaginationText(result: PaginatedResult<unknown>): string {
  const lines: string[] = [
    `Page ${result.page} of ${result.totalPages}`,
    `Showing ${result.items.length} of ${result.totalItems} items (page size: ${result.pageSize})`,
  ];
  if (result.hasNextPage) lines.push(`Next page: ${result.page + 1}`);
  if (result.hasPrevPage) lines.push(`Prev page: ${result.page - 1}`);
  return lines.join('\n');
}
