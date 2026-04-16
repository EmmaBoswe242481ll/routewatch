import type { RouteChange } from '../diff/types';

export interface DiffContext {
  fromRef: string;
  toRef: string;
  timestamp: number;
}

export interface DiffResult {
  context: DiffContext;
  added: RouteChange[];
  removed: RouteChange[];
  modified: RouteChange[];
  unchanged: number;
}

export function partitionChanges(changes: RouteChange[]): Pick<DiffResult, 'added' | 'removed' | 'modified'> {
  const added: RouteChange[] = [];
  const removed: RouteChange[] = [];
  const modified: RouteChange[] = [];

  for (const change of changes) {
    if (change.type === 'added') added.push(change);
    else if (change.type === 'removed') removed.push(change);
    else if (change.type === 'modified') modified.push(change);
  }

  return { added, removed, modified };
}

export function buildDiffResult(
  changes: RouteChange[],
  context: DiffContext,
  totalBefore: number
): DiffResult {
  const { added, removed, modified } = partitionChanges(changes);
  const unchanged = totalBefore - removed.length - modified.length;
  return { context, added, removed, modified, unchanged: Math.max(0, unchanged) };
}

export function formatDiffSummary(result: DiffResult): string {
  const lines: string[] = [
    `Diff: ${result.context.fromRef} → ${result.context.toRef}`,
    `  Added:    ${result.added.length}`,
    `  Removed:  ${result.removed.length}`,
    `  Modified: ${result.modified.length}`,
    `  Unchanged: ${result.unchanged}`,
  ];
  return lines.join('\n');
}
