import { RouteChange } from '../diff/types';

export interface PartitionRule {
  name: string;
  predicate: (change: RouteChange) => boolean;
}

export interface PartitionResult {
  name: string;
  changes: RouteChange[];
}

export interface PartitionSummary {
  total: number;
  partitions: Array<{ name: string; count: number }>;
  unmatched: number;
}

export function partitionChanges(
  changes: RouteChange[],
  rules: PartitionRule[]
): { partitions: PartitionResult[]; unmatched: RouteChange[] } {
  const buckets = new Map<string, RouteChange[]>();
  for (const rule of rules) {
    buckets.set(rule.name, []);
  }

  const unmatched: RouteChange[] = [];

  for (const change of changes) {
    let matched = false;
    for (const rule of rules) {
      if (rule.predicate(change)) {
        buckets.get(rule.name)!.push(change);
        matched = true;
        break;
      }
    }
    if (!matched) {
      unmatched.push(change);
    }
  }

  const partitions: PartitionResult[] = rules.map(rule => ({
    name: rule.name,
    changes: buckets.get(rule.name)!,
  }));

  return { partitions, unmatched };
}

export function buildPartitionSummary(
  partitions: PartitionResult[],
  unmatched: RouteChange[]
): PartitionSummary {
  const total = partitions.reduce((sum, p) => sum + p.changes.length, 0) + unmatched.length;
  return {
    total,
    partitions: partitions.map(p => ({ name: p.name, count: p.changes.length })),
    unmatched: unmatched.length,
  };
}

export function formatPartitionText(summary: PartitionSummary): string {
  const lines: string[] = [`Partitions (${summary.total} total):`];
  for (const p of summary.partitions) {
    lines.push(`  ${p.name}: ${p.count}`);
  }
  if (summary.unmatched > 0) {
    lines.push(`  (unmatched): ${summary.unmatched}`);
  }
  return lines.join('\n');
}
