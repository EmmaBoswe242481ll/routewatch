import { RouteChange } from '../diff/types';

export interface ClampOptions {
  maxAdded?: number;
  maxRemoved?: number;
  maxModified?: number;
  maxTotal?: number;
}

export interface ClampResult {
  changes: RouteChange[];
  clamped: boolean;
  originalCount: number;
  clampedCount: number;
}

export function clampChanges(
  changes: RouteChange[],
  options: ClampOptions
): ClampResult {
  const originalCount = changes.length;

  let added = changes.filter(c => c.type === 'added');
  let removed = changes.filter(c => c.type === 'removed');
  let modified = changes.filter(c => c.type === 'modified');

  if (options.maxAdded !== undefined) added = added.slice(0, options.maxAdded);
  if (options.maxRemoved !== undefined) removed = removed.slice(0, options.maxRemoved);
  if (options.maxModified !== undefined) modified = modified.slice(0, options.maxModified);

  let result = [...added, ...removed, ...modified];

  if (options.maxTotal !== undefined) {
    result = result.slice(0, options.maxTotal);
  }

  return {
    changes: result,
    clamped: result.length < originalCount,
    originalCount,
    clampedCount: result.length,
  };
}

export function formatClampText(result: ClampResult): string {
  if (!result.clamped) {
    return `Clamping: all ${result.originalCount} change(s) retained.`;
  }
  const dropped = result.originalCount - result.clampedCount;
  return `Clamping: retained ${result.clampedCount}/${result.originalCount} change(s), dropped ${dropped}.`;
}
