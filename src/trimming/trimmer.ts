import { RouteChange } from '../diff/types';

export interface TrimOptions {
  maxPathLength?: number;
  stripLeadingSlash?: boolean;
  stripTrailingSlash?: boolean;
  collapseSlashes?: boolean;
}

export interface TrimResult {
  original: string;
  trimmed: string;
  changed: boolean;
}

export function trimPath(path: string, options: TrimOptions = {}): TrimResult {
  const {
    maxPathLength,
    stripLeadingSlash = false,
    stripTrailingSlash = true,
    collapseSlashes = true,
  } = options;

  let trimmed = path.trim();

  if (collapseSlashes) {
    trimmed = trimmed.replace(/\/+/g, '/');
  }

  if (stripLeadingSlash) {
    trimmed = trimmed.replace(/^\//, '');
  }

  if (stripTrailingSlash && trimmed !== '/') {
    trimmed = trimmed.replace(/\/$/, '');
  }

  if (maxPathLength !== undefined && trimmed.length > maxPathLength) {
    trimmed = trimmed.slice(0, maxPathLength);
  }

  return { original: path, trimmed, changed: path !== trimmed };
}

export function trimChange(
  change: RouteChange,
  options: TrimOptions = {}
): RouteChange {
  const result = trimPath(change.path, options);
  return result.changed ? { ...change, path: result.trimmed } : change;
}

export function trimChanges(
  changes: RouteChange[],
  options: TrimOptions = {}
): RouteChange[] {
  return changes.map((c) => trimChange(c, options));
}

export function formatTrimText(results: TrimResult[]): string {
  const changed = results.filter((r) => r.changed);
  if (changed.length === 0) return 'No paths trimmed.';
  const lines = changed.map(
    (r) => `  "${r.original}" → "${r.trimmed}"`
  );
  return `Trimmed ${changed.length} path(s):\n${lines.join('\n')}`;
}
