import { RouteChange } from '../diff/types';

export interface DeduplicationResult {
  unique: RouteChange[];
  duplicates: RouteChange[];
  deduplicatedCount: number;
}

export function changeKey(change: RouteChange): string {
  return `${change.method}:${change.path}:${change.type}`;
}

export function deduplicateChanges(changes: RouteChange[]): DeduplicationResult {
  const seen = new Map<string, RouteChange>();
  const duplicates: RouteChange[] = [];

  for (const change of changes) {
    const key = changeKey(change);
    if (seen.has(key)) {
      duplicates.push(change);
    } else {
      seen.set(key, change);
    }
  }

  return {
    unique: Array.from(seen.values()),
    duplicates,
    deduplicatedCount: duplicates.length,
  };
}

export function mergeChangeSets(
  primary: RouteChange[],
  secondary: RouteChange[]
): RouteChange[] {
  const seen = new Map<string, RouteChange>();

  for (const change of primary) {
    seen.set(changeKey(change), change);
  }

  for (const change of secondary) {
    const key = changeKey(change);
    if (!seen.has(key)) {
      seen.set(key, change);
    }
  }

  return Array.from(seen.values());
}

export function formatDeduplicationText(result: DeduplicationResult): string {
  const lines: string[] = [
    `Deduplication Summary`,
    `  Unique changes  : ${result.unique.length}`,
    `  Duplicates found: ${result.deduplicatedCount}`,
  ];
  return lines.join('\n');
}
