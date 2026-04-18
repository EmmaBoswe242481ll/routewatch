import { RouteChange } from '../diff/types';

export interface SquashOptions {
  groupBy: 'path' | 'method' | 'both';
  keepLast?: boolean;
}

export interface SquashResult {
  changes: RouteChange[];
  originalCount: number;
  squashedCount: number;
}

function squashKey(change: RouteChange, groupBy: SquashOptions['groupBy']): string {
  if (groupBy === 'path') return change.route.path;
  if (groupBy === 'method') return change.route.method;
  return `${change.route.method}:${change.route.path}`;
}

export function squashChanges(
  changes: RouteChange[],
  options: SquashOptions = { groupBy: 'both', keepLast: true }
): SquashResult {
  const map = new Map<string, RouteChange>();

  for (const change of changes) {
    const key = squashKey(change, options.groupBy);
    if (!map.has(key) || options.keepLast) {
      map.set(key, change);
    }
  }

  const squashed = Array.from(map.values());

  return {
    changes: squashed,
    originalCount: changes.length,
    squashedCount: squashed.length,
  };
}

export function formatSquashText(result: SquashResult): string {
  const lines: string[] = [
    `Squash Summary`,
    `  Original : ${result.originalCount}`,
    `  After    : ${result.squashedCount}`,
    `  Removed  : ${result.originalCount - result.squashedCount}`,
  ];
  return lines.join('\n');
}
