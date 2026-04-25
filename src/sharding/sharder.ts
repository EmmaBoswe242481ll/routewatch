import { RouteChange } from '../diff/types';

export interface ShardConfig {
  shardCount: number;
  strategy: 'hash' | 'prefix' | 'method';
}

export interface ShardResult {
  shardIndex: number;
  changes: RouteChange[];
}

export interface ShardSummary {
  totalShards: number;
  strategy: ShardConfig['strategy'];
  distribution: Record<number, number>;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function getShardKey(change: RouteChange, strategy: ShardConfig['strategy']): string {
  switch (strategy) {
    case 'prefix': {
      const parts = change.route.path.split('/').filter(Boolean);
      return parts[0] ?? 'root';
    }
    case 'method':
      return change.route.method;
    case 'hash':
    default:
      return `${change.route.method}:${change.route.path}`;
  }
}

export function shardChanges(
  changes: RouteChange[],
  config: ShardConfig
): ShardResult[] {
  const { shardCount, strategy } = config;
  const buckets: RouteChange[][] = Array.from({ length: shardCount }, () => []);

  for (const change of changes) {
    const key = getShardKey(change, strategy);
    const index = hashString(key) % shardCount;
    buckets[index].push(change);
  }

  return buckets.map((ch, i) => ({ shardIndex: i, changes: ch }));
}

export function buildShardSummary(
  results: ShardResult[],
  strategy: ShardConfig['strategy']
): ShardSummary {
  const distribution: Record<number, number> = {};
  for (const r of results) {
    distribution[r.shardIndex] = r.changes.length;
  }
  return { totalShards: results.length, strategy, distribution };
}

export function formatShardText(summary: ShardSummary): string {
  const lines = [
    `Sharding strategy: ${summary.strategy}`,
    `Total shards: ${summary.totalShards}`,
    'Distribution:',
  ];
  for (const [idx, count] of Object.entries(summary.distribution)) {
    lines.push(`  Shard ${idx}: ${count} change(s)`);
  }
  return lines.join('\n');
}
