import { Route } from '../parsers/types';
import { RouteDiff, RouteChange, ChangeType } from './types';

export function routeKey(route: Route): string {
  return `${route.method?.toUpperCase() ?? 'ANY'}:${route.path}`;
}

function detectParamChanges(before: Route, after: Route): string[] {
  const notes: string[] = [];
  const removedParams = (before.params ?? []).filter(
    (p) => !(after.params ?? []).includes(p)
  );
  const addedParams = (after.params ?? []).filter(
    (p) => !(before.params ?? []).includes(p)
  );
  if (removedParams.length > 0) {
    notes.push(`Removed params: ${removedParams.join(', ')}`);
  }
  if (addedParams.length > 0) {
    notes.push(`Added params: ${addedParams.join(', ')}`);
  }
  return notes;
}

export function compareRoutes(
  before: Route[],
  after: Route[]
): RouteDiff {
  const beforeMap = new Map<string, Route>();
  const afterMap = new Map<string, Route>();

  for (const route of before) beforeMap.set(routeKey(route), route);
  for (const route of after) afterMap.set(routeKey(route), route);

  const changes: RouteChange[] = [];

  for (const [key, route] of beforeMap) {
    if (!afterMap.has(key)) {
      changes.push({ type: ChangeType.Removed, route });
    } else {
      const afterRoute = afterMap.get(key)!;
      const notes = detectParamChanges(route, afterRoute);
      if (notes.length > 0) {
        changes.push({
          type: ChangeType.Modified,
          route: afterRoute,
          before: route,
          notes,
        });
      }
    }
  }

  for (const [key, route] of afterMap) {
    if (!beforeMap.has(key)) {
      changes.push({ type: ChangeType.Added, route });
    }
  }

  return {
    added: changes.filter((c) => c.type === ChangeType.Added).length,
    removed: changes.filter((c) => c.type === ChangeType.Removed).length,
    modified: changes.filter((c) => c.type === ChangeType.Modified).length,
    changes,
  };
}
