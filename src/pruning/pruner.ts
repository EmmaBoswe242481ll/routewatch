import { RouteChange } from '../diff/types';

export interface PruneConfig {
  maxAge?: number; // milliseconds
  maxCount?: number;
  removeDuplicatePaths?: boolean;
  removeEmptyMethods?: boolean;
}

export interface PruneResult {
  kept: RouteChange[];
  pruned: RouteChange[];
  reasons: Record<string, string>;
}

export function pruneChanges(
  changes: RouteChange[],
  config: PruneConfig = {}
): PruneResult {
  const pruned: RouteChange[] = [];
  const reasons: Record<string, string> = {};
  let kept = [...changes];

  if (config.removeEmptyMethods) {
    const next: RouteChange[] = [];
    for (const c of kept) {
      if (!c.method || c.method.trim() === '') {
        pruned.push(c);
        reasons[`${c.method}:${c.path}`] = 'empty method';
      } else {
        next.push(c);
      }
    }
    kept = next;
  }

  if (config.removeDuplicatePaths) {
    const seen = new Set<string>();
    const next: RouteChange[] = [];
    for (const c of kept) {
      const key = `${c.method?.toUpperCase()}:${c.path}`;
      if (seen.has(key)) {
        pruned.push(c);
        reasons[key] = 'duplicate path+method';
      } else {
        seen.add(key);
        next.push(c);
      }
    }
    kept = next;
  }

  if (config.maxAge !== undefined) {
    const cutoff = Date.now() - config.maxAge;
    const next: RouteChange[] = [];
    for (const c of kept) {
      const ts = (c as any).timestamp;
      if (ts !== undefined && ts < cutoff) {
        pruned.push(c);
        reasons[`${c.method}:${c.path}`] = 'exceeded maxAge';
      } else {
        next.push(c);
      }
    }
    kept = next;
  }

  if (config.maxCount !== undefined && kept.length > config.maxCount) {
    const overflow = kept.splice(config.maxCount);
    for (const c of overflow) {
      pruned.push(c);
      reasons[`${c.method}:${c.path}`] = 'exceeded maxCount';
    }
  }

  return { kept, pruned, reasons };
}

export function formatPruneText(result: PruneResult): string {
  const lines: string[] = [
    `Pruning summary: ${result.kept.length} kept, ${result.pruned.length} pruned`,
  ];
  for (const c of result.pruned) {
    const key = `${c.method}:${c.path}`;
    lines.push(`  - ${key} (${result.reasons[key] ?? 'unknown'})`);
  }
  return lines.join('\n');
}
