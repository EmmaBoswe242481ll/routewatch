import { RouteChange } from '../diff/types';

export interface Cluster {
  id: string;
  label: string;
  changes: RouteChange[];
}

export interface ClusterOptions {
  maxSize?: number;
  byPrefix?: boolean;
  byMethod?: boolean;
}

export function clusterByPrefix(changes: RouteChange[]): Cluster[] {
  const map = new Map<string, RouteChange[]>();
  for (const change of changes) {
    const parts = change.path.split('/').filter(Boolean);
    const prefix = parts.length > 0 ? `/${parts[0]}` : '/';
    if (!map.has(prefix)) map.set(prefix, []);
    map.get(prefix)!.push(change);
  }
  return Array.from(map.entries()).map(([prefix, items]) => ({
    id: `prefix:${prefix}`,
    label: prefix,
    changes: items,
  }));
}

export function clusterByMethod(changes: RouteChange[]): Cluster[] {
  const map = new Map<string, RouteChange[]>();
  for (const change of changes) {
    const method = change.method ?? 'UNKNOWN';
    if (!map.has(method)) map.set(method, []);
    map.get(method)!.push(change);
  }
  return Array.from(map.entries()).map(([method, items]) => ({
    id: `method:${method}`,
    label: method,
    changes: items,
  }));
}

export function clusterChanges(
  changes: RouteChange[],
  options: ClusterOptions = {}
): Cluster[] {
  if (options.byMethod) return clusterByMethod(changes);
  return clusterByPrefix(changes);
}

export function formatClusterText(clusters: Cluster[]): string {
  if (clusters.length === 0) return 'No clusters.';
  return clusters
    .map(c => `[${c.label}] ${c.changes.length} change(s)`)
    .join('\n');
}
