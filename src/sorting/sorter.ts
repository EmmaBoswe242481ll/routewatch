import { RouteChange } from '../diff/types';

export type SortField = 'path' | 'method' | 'changeType' | 'severity';
export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  field: SortField;
  order?: SortOrder;
}

const CHANGE_TYPE_ORDER: Record<string, number> = {
  added: 0,
  modified: 1,
  removed: 2,
};

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

function getValue(change: RouteChange, field: SortField): string | number {
  switch (field) {
    case 'path':
      return change.route.path;
    case 'method':
      return change.route.method;
    case 'changeType':
      return CHANGE_TYPE_ORDER[change.type] ?? 99;
    case 'severity':
      return SEVERITY_ORDER[(change as any).severity] ?? 99;
    default:
      return '';
  }
}

export function sortChanges(
  changes: RouteChange[],
  options: SortOptions
): RouteChange[] {
  const { field, order = 'asc' } = options;
  const sorted = [...changes].sort((a, b) => {
    const av = getValue(a, field);
    const bv = getValue(b, field);
    if (av < bv) return -1;
    if (av > bv) return 1;
    return 0;
  });
  return order === 'desc' ? sorted.reverse() : sorted;
}

export function formatSortText(changes: RouteChange[], options: SortOptions): string {
  const lines = [`Sorted by ${options.field} (${options.order ?? 'asc'}):`];
  for (const c of changes) {
    lines.push(`  [${c.type}] ${c.route.method} ${c.route.path}`);
  }
  return lines.join('\n');
}
