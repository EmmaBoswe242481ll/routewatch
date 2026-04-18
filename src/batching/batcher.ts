import { RouteChange } from '../diff/types';

export interface BatchOptions {
  size: number;
  overlap?: number;
}

export interface Batch<T> {
  index: number;
  items: T[];
  total: number;
  batchCount: number;
}

export function batchChanges(
  changes: RouteChange[],
  options: BatchOptions
): Batch<RouteChange>[] {
  const { size, overlap = 0 } = options;
  if (size <= 0) throw new Error('Batch size must be greater than 0');

  const step = Math.max(1, size - overlap);
  const batches: Batch<RouteChange>[] = [];
  const batchCount = Math.ceil(Math.max(1, changes.length - overlap) / step);

  for (let i = 0; i < changes.length; i += step) {
    batches.push({
      index: batches.length,
      items: changes.slice(i, i + size),
      total: changes.length,
      batchCount,
    });
    if (i + size >= changes.length) break;
  }

  if (batches.length === 0) {
    batches.push({ index: 0, items: [], total: 0, batchCount: 1 });
  }

  return batches;
}

export function formatBatchText(batches: Batch<RouteChange>[]): string {
  if (batches.length === 0) return 'No batches.';
  const lines = batches.map(
    (b) => `Batch ${b.index + 1}/${b.batchCount}: ${b.items.length} change(s)`
  );
  lines.unshift(`Total batches: ${batches.length}`);
  return lines.join('\n');
}
