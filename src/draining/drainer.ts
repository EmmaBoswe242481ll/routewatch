import { RouteChange } from '../diff/types';

export interface DrainOptions {
  maxAge?: number; // milliseconds
  maxCount?: number;
  predicate?: (change: RouteChange) => boolean;
}

export interface DrainResult {
  drained: RouteChange[];
  remaining: RouteChange[];
  drainedCount: number;
  remainingCount: number;
}

export function drainChanges(
  changes: RouteChange[],
  options: DrainOptions = {}
): DrainResult {
  const { maxAge, maxCount, predicate } = options;
  const now = Date.now();

  let drained: RouteChange[] = [];
  let remaining: RouteChange[] = [];

  for (const change of changes) {
    let shouldDrain = false;

    if (predicate && predicate(change)) {
      shouldDrain = true;
    } else if (maxAge !== undefined) {
      const ts = (change as any).timestamp;
      if (typeof ts === 'number' && now - ts > maxAge) {
        shouldDrain = true;
      }
    }

    if (shouldDrain) {
      drained.push(change);
    } else {
      remaining.push(change);
    }
  }

  if (maxCount !== undefined && drained.length > maxCount) {
    const overflow = drained.splice(maxCount);
    remaining = [...overflow, ...remaining];
  }

  return {
    drained,
    remaining,
    drainedCount: drained.length,
    remainingCount: remaining.length,
  };
}

export function formatDrainText(result: DrainResult): string {
  const lines: string[] = [
    `Drain summary:`,
    `  Drained : ${result.drainedCount}`,
    `  Remaining: ${result.remainingCount}`,
  ];
  for (const c of result.drained) {
    lines.push(`  - [${c.type}] ${c.method ?? '*'} ${c.path}`);
  }
  return lines.join('\n');
}
