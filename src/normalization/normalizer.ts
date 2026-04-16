import { RouteChange } from '../diff/types';

export interface NormalizationOptions {
  lowercasePaths?: boolean;
  stripTrailingSlash?: boolean;
  sortQueryParams?: boolean;
  collapseParams?: boolean;
}

const DEFAULT_OPTIONS: NormalizationOptions = {
  lowercasePaths: true,
  stripTrailingSlash: true,
  sortQueryParams: true,
  collapseParams: false,
};

export function normalizePath(path: string, options: NormalizationOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let normalized = path;

  if (opts.lowercasePaths) {
    normalized = normalized.toLowerCase();
  }

  if (opts.stripTrailingSlash && normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  if (opts.collapseParams) {
    normalized = normalized.replace(/:[^/]+/g, ':param').replace(/\[[^\]]+\]/g, '[param]');
  }

  return normalized;
}

export function normalizeMethod(method: string): string {
  return method.toUpperCase().trim();
}

export function normalizeChange(change: RouteChange, options: NormalizationOptions = {}): RouteChange {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const normalized: RouteChange = {
    ...change,
    route: {
      ...change.route,
      path: normalizePath(change.route.path, opts),
      method: normalizeMethod(change.route.method),
    },
  };

  if (change.previousRoute) {
    normalized.previousRoute = {
      ...change.previousRoute,
      path: normalizePath(change.previousRoute.path, opts),
      method: normalizeMethod(change.previousRoute.method),
    };
  }

  return normalized;
}

export function normalizeChanges(changes: RouteChange[], options: NormalizationOptions = {}): RouteChange[] {
  return changes.map((change) => normalizeChange(change, options));
}

export function formatNormalizationText(original: RouteChange[], normalized: RouteChange[]): string {
  const lines: string[] = ['Normalization Summary', '====================='];
  const changed = normalized.filter((n, i) => {
    const o = original[i];
    return o.route.path !== n.route.path || o.route.method !== n.route.method;
  });
  lines.push(`Total changes processed: ${original.length}`);
  lines.push(`Routes normalized: ${changed.length}`);
  changed.forEach((n, i) => {
    const o = original[i];
    lines.push(`  ${o.route.method} ${o.route.path} -> ${n.route.method} ${n.route.path}`);
  });
  return lines.join('\n');
}
