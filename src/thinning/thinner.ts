import { RouteChange } from '../diff/types';

export interface ThinConfig {
  maxPerPrefix?: number;
  maxPerMethod?: number;
  maxTotal?: number;
  strategy?: 'prefix' | 'method' | 'total';
}

export interface ThinResult {
  kept: RouteChange[];
  dropped: RouteChange[];
  totalIn: number;
  totalOut: number;
}

function getPrefix(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts.length > 0 ? `/${parts[0]}` : '/';
}

export function thinByPrefix(
  changes: RouteChange[],
  maxPerPrefix: number
): { kept: RouteChange[]; dropped: RouteChange[] } {
  const buckets = new Map<string, RouteChange[]>();
  for (const change of changes) {
    const prefix = getPrefix(change.route.path);
    if (!buckets.has(prefix)) buckets.set(prefix, []);
    buckets.get(prefix)!.push(change);
  }
  const kept: RouteChange[] = [];
  const dropped: RouteChange[] = [];
  for (const [, group] of buckets) {
    kept.push(...group.slice(0, maxPerPrefix));
    dropped.push(...group.slice(maxPerPrefix));
  }
  return { kept, dropped };
}

export function thinByMethod(
  changes: RouteChange[],
  maxPerMethod: number
): { kept: RouteChange[]; dropped: RouteChange[] } {
  const buckets = new Map<string, RouteChange[]>();
  for (const change of changes) {
    const method = change.route.method;
    if (!buckets.has(method)) buckets.set(method, []);
    buckets.get(method)!.push(change);
  }
  const kept: RouteChange[] = [];
  const dropped: RouteChange[] = [];
  for (const [, group] of buckets) {
    kept.push(...group.slice(0, maxPerMethod));
    dropped.push(...group.slice(maxPerMethod));
  }
  return { kept, dropped };
}

export function thinChanges(
  changes: RouteChange[],
  config: ThinConfig = {}
): ThinResult {
  const { maxPerPrefix, maxPerMethod, maxTotal, strategy = 'total' } = config;
  let kept = [...changes];
  let dropped: RouteChange[] = [];

  if (strategy === 'prefix' && maxPerPrefix != null) {
    const result = thinByPrefix(kept, maxPerPrefix);
    kept = result.kept;
    dropped = [...dropped, ...result.dropped];
  } else if (strategy === 'method' && maxPerMethod != null) {
    const result = thinByMethod(kept, maxPerMethod);
    kept = result.kept;
    dropped = [...dropped, ...result.dropped];
  }

  if (maxTotal != null && kept.length > maxTotal) {
    dropped = [...dropped, ...kept.slice(maxTotal)];
    kept = kept.slice(0, maxTotal);
  }

  return { kept, dropped, totalIn: changes.length, totalOut: kept.length };
}

export function formatThinText(result: ThinResult): string {
  const lines: string[] = [
    `Thinning: ${result.totalIn} in → ${result.totalOut} out (dropped ${result.dropped.length})`,
  ];
  if (result.dropped.length > 0) {
    lines.push('Dropped routes:');
    for (const c of result.dropped) {
      lines.push(`  ${c.route.method} ${c.route.path}`);
    }
  }
  return lines.join('\n');
}
