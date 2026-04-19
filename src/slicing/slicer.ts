import { RouteChange } from '../diff/types';

export interface SliceConfig {
  offset: number;
  limit: number;
}

export interface SliceResult {
  changes: RouteChange[];
  offset: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export function sliceChanges(
  changes: RouteChange[],
  config: SliceConfig
): SliceResult {
  const { offset, limit } = config;
  const total = changes.length;
  const safeOffset = Math.max(0, Math.min(offset, total));
  const safeLimit = Math.max(1, limit);
  const sliced = changes.slice(safeOffset, safeOffset + safeLimit);

  return {
    changes: sliced,
    offset: safeOffset,
    limit: safeLimit,
    total,
    hasMore: safeOffset + safeLimit < total,
  };
}

export function formatSliceText(result: SliceResult): string {
  const lines: string[] = [
    `Slice: offset=${result.offset}, limit=${result.limit}`,
    `Showing ${result.changes.length} of ${result.total} changes`,
    result.hasMore
      ? `More available: next offset=${result.offset + result.limit}`
      : 'No more changes.',
  ];
  return lines.join('\n');
}
