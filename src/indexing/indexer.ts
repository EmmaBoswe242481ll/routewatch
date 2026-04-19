import type { RouteChange } from '../diff/types';

export interface RouteIndex {
  byPath: Map<string, RouteChange[]>;
  byMethod: Map<string, RouteChange[]>;
  byType: Map<string, RouteChange[]>;
}

export interface IndexOptions {
  caseSensitive?: boolean;
}

export function buildIndex(
  changes: RouteChange[],
  options: IndexOptions = {}
): RouteIndex {
  const { caseSensitive = false } = options;
  const normalize = (s: string) => (caseSensitive ? s : s.toLowerCase());

  const byPath = new Map<string, RouteChange[]>();
  const byMethod = new Map<string, RouteChange[]>();
  const byType = new Map<string, RouteChange[]>();

  for (const change of changes) {
    const path = normalize(change.route.path);
    const method = normalize(change.route.method);
    const type = change.type;

    if (!byPath.has(path)) byPath.set(path, []);
    byPath.get(path)!.push(change);

    if (!byMethod.has(method)) byMethod.set(method, []);
    byMethod.get(method)!.push(change);

    if (!byType.has(type)) byType.set(type, []);
    byType.get(type)!.push(change);
  }

  return { byPath, byMethod, byType };
}

export function lookupByPath(
  index: RouteIndex,
  path: string,
  caseSensitive = false
): RouteChange[] {
  const key = caseSensitive ? path : path.toLowerCase();
  return index.byPath.get(key) ?? [];
}

export function lookupByMethod(
  index: RouteIndex,
  method: string,
  caseSensitive = false
): RouteChange[] {
  const key = caseSensitive ? method : method.toLowerCase();
  return index.byMethod.get(key) ?? [];
}

export function formatIndexText(index: RouteIndex): string {
  const lines: string[] = ['Route Index Summary:'];
  lines.push(`  Unique paths : ${index.byPath.size}`);
  lines.push(`  Methods      : ${[...index.byMethod.keys()].join(', ')}`);
  lines.push(`  Change types : ${[...index.byType.keys()].join(', ')}`);
  return lines.join('\n');
}
