import type { ParsedRoute } from '../parsers/types';
import type { ChangeType, DiffResult, RouteChange } from './types';

function routeKey(route: ParsedRoute): string {
  return `${route.method.toUpperCase()}:${route.path}`;
}

export function compareRoutes(
  fromRoutes: ParsedRoute[],
  toRoutes: ParsedRoute[],
  fromCommit: string,
  toCommit: string
): DiffResult {
  const fromMap = new Map<string, ParsedRoute>();
  const toMap = new Map<string, ParsedRoute>();

  for (const route of fromRoutes) fromMap.set(routeKey(route), route);
  for (const route of toRoutes) toMap.set(routeKey(route), route);

  const changes: RouteChange[] = [];

  for (const [key, route] of toMap) {
    if (!fromMap.has(key)) {
      changes.push({
        type: 'added',
        method: route.method,
        path: route.path,
        params: route.params,
        after: { method: route.method, path: route.path, params: route.params },
      });
    } else {
      const before = fromMap.get(key)!;
      const paramsChanged =
        JSON.stringify(before.params?.sort()) !== JSON.stringify(route.params?.sort());
      if (paramsChanged) {
        changes.push({
          type: 'modified',
          method: route.method,
          path: route.path,
          before: { method: before.method, path: before.path, params: before.params },
          after: { method: route.method, path: route.path, params: route.params },
        });
      }
    }
  }

  for (const [key, route] of fromMap) {
    if (!toMap.has(key)) {
      changes.push({
        type: 'removed',
        method: route.method,
        path: route.path,
        params: route.params,
        before: { method: route.method, path: route.path, params: route.params },
      });
    }
  }

  const summary = {
    added: changes.filter((c) => c.type === 'added').length,
    removed: changes.filter((c) => c.type === 'removed').length,
    modified: changes.filter((c) => c.type === 'modified').length,
    total: changes.length,
  };

  return { fromCommit, toCommit, changes, summary };
}
