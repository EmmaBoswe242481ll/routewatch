import { RouteChange } from '../diff/types';

export interface PivotEntry {
  key: string;
  changes: RouteChange[];
  count: number;
}

export interface PivotResult {
  field: PivotField;
  entries: PivotEntry[];
  total: number;
}

export type PivotField = 'method' | 'changeType' | 'prefix' | 'status';

function getFieldValue(change: RouteChange, field: PivotField): string {
  switch (field) {
    case 'method':
      return change.method ?? 'UNKNOWN';
    case 'changeType':
      return change.changeType;
    case 'prefix': {
      const parts = change.path.split('/').filter(Boolean);
      return parts.length > 0 ? `/${parts[0]}` : '/';
    }
    case 'status':
      return change.breaking ? 'breaking' : 'non-breaking';
    default:
      return 'unknown';
  }
}

export function pivotChanges(changes: RouteChange[], field: PivotField): PivotResult {
  const map = new Map<string, RouteChange[]>();

  for (const change of changes) {
    const key = getFieldValue(change, field);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(change);
  }

  const entries: PivotEntry[] = Array.from(map.entries())
    .map(([key, items]) => ({ key, changes: items, count: items.length }))
    .sort((a, b) => b.count - a.count);

  return { field, entries, total: changes.length };
}

export function formatPivotText(result: PivotResult): string {
  const lines: string[] = [`Pivot by ${result.field} (${result.total} total):`, ''];
  for (const entry of result.entries) {
    lines.push(`  ${entry.key}: ${entry.count}`);
  }
  return lines.join('\n');
}
