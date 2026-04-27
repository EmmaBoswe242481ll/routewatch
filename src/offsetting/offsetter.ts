import { RouteChange } from '../diff/types';

export interface OffsetConfig {
  skip: number;
  limit?: number;
}

export interface OffsetResult {
  changes: RouteChange[];
  skip: number;
  limit: number | undefined;
  total: number;
  remaining: number;
}

export function offsetChanges(
  changes: RouteChange[],
  config: OffsetConfig
): OffsetResult {
  const { skip, limit } = config;
  const total = changes.length;
  const skipped = changes.slice(skip);
  const sliced = limit !== undefined ? skipped.slice(0, limit) : skipped;
  const remaining = Math.max(0, total - skip - sliced.length);

  return {
    changes: sliced,
    skip,
    limit,
    total,
    remaining,
  };
}

export function formatOffsetText(result: OffsetResult): string {
  const lines: string[] = [
    `Offset: skip=${result.skip}, limit=${
      result.limit !== undefined ? result.limit : 'none'
    }`,
    `Total: ${result.total}, Returned: ${result.changes.length}, Remaining: ${result.remaining}`,
  ];

  if (result.changes.length === 0) {
    lines.push('No changes in range.');
  } else {
    result.changes.forEach((c) => {
      lines.push(`  [${c.type}] ${c.method} ${c.path}`);
    });
  }

  return lines.join('\n');
}
