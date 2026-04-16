import { RouteChange } from '../diff/types';

export interface ResolvedRoute {
  original: string;
  resolved: string;
  params: Record<string, string>;
  method: string;
}

export interface ResolutionOptions {
  baseUrl?: string;
  stripPrefix?: string;
  addPrefix?: string;
}

export function resolveRoutePath(path: string, options: ResolutionOptions = {}): string {
  let resolved = path;

  if (options.stripPrefix && resolved.startsWith(options.stripPrefix)) {
    resolved = resolved.slice(options.stripPrefix.length) || '/';
  }

  if (options.addPrefix) {
    const prefix = options.addPrefix.endsWith('/')
      ? options.addPrefix.slice(0, -1)
      : options.addPrefix;
    resolved = `${prefix}${resolved}`;
  }

  if (options.baseUrl) {
    const base = options.baseUrl.replace(/\/$/, '');
    return `${base}${resolved}`;
  }

  return resolved;
}

export function resolveRoute(
  change: RouteChange,
  options: ResolutionOptions = {}
): ResolvedRoute {
  const resolved = resolveRoutePath(change.path, options);
  const params: Record<string, string> = {};

  const segments = change.path.split('/');
  const resolvedSegments = resolved.split('/');

  segments.forEach((seg, i) => {
    if (seg.startsWith(':')) {
      params[seg.slice(1)] = resolvedSegments[i] ?? seg;
    } else if (seg.startsWith('[') && seg.endsWith(']')) {
      params[seg.slice(1, -1)] = resolvedSegments[i] ?? seg;
    }
  });

  return {
    original: change.path,
    resolved,
    params,
    method: change.method,
  };
}

export function resolveRoutes(
  changes: RouteChange[],
  options: ResolutionOptions = {}
): ResolvedRoute[] {
  return changes.map((c) => resolveRoute(c, options));
}

export function formatResolutionText(routes: ResolvedRoute[]): string {
  if (routes.length === 0) return 'No routes resolved.';
  const lines = routes.map(
    (r) => `[${r.method}] ${r.original} -> ${r.resolved}`
  );
  return `Resolved ${routes.length} route(s):\n${lines.join('\n')}`;
}
