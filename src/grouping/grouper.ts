import { RouteChange } from '../diff/types';
import { GroupedChanges, GroupingStrategy, RouteGroup } from './types';

export function groupByPrefix(changes: RouteChange[], depth: number = 1): RouteGroup[] {
  const groups = new Map<string, RouteChange[]>();

  for (const change of changes) {
    const route = change.before?.path ?? change.after?.path ?? '';
    const parts = route.split('/').filter(Boolean);
    const key = '/' + parts.slice(0, depth).join('/');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(change);
  }

  return Array.from(groups.entries()).map(([prefix, items]) => ({
    label: prefix || '/',
    changes: items,
  }));
}

export function groupByMethod(changes: RouteChange[]): RouteGroup[] {
  const groups = new Map<string, RouteChange[]>();

  for (const change of changes) {
    const method = (change.before?.method ?? change.after?.method ?? 'UNKNOWN').toUpperCase();
    if (!groups.has(method)) groups.set(method, []);
    groups.get(method)!.push(change);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({ label, changes: items }));
}

export function groupByChangeType(changes: RouteChange[]): RouteGroup[] {
  const groups = new Map<string, RouteChange[]>();

  for (const change of changes) {
    const type = change.type;
    if (!groups.has(type)) groups.set(type, []);
    groups.get(type)!.push(change);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({ label, changes: items }));
}

export function groupChanges(
  changes: RouteChange[],
  strategy: GroupingStrategy,
  prefixDepth = 1
): GroupedChanges {
  let groups: RouteGroup[];

  switch (strategy) {
    case 'prefix':
      groups = groupByPrefix(changes, prefixDepth);
      break;
    case 'method':
      groups = groupByMethod(changes);
      break;
    case 'type':
      groups = groupByChangeType(changes);
      break;
    default:
      groups = [{ label: 'all', changes }];
  }

  return { strategy, groups, total: changes.length };
}
