import { RouteChange } from '../diff/types';

export interface CollapseConfig {
  maxDepth?: number;
  separator?: string;
  collapseParams?: boolean;
}

export interface CollapseResult {
  original: string;
  collapsed: string;
  depth: number;
  wasCollapsed: boolean;
}

const DEFAULT_CONFIG: Required<CollapseConfig> = {
  maxDepth: 3,
  separator: '/',
  collapseParams: true,
};

export function collapsePath(path: string, config: CollapseConfig = {}): CollapseResult {
  const { maxDepth, separator, collapseParams } = { ...DEFAULT_CONFIG, ...config };

  let working = path;
  if (collapseParams) {
    working = working.replace(/:[^/]+/g, ':param').replace(/\[[^\]]+\]/g, '[param]');
  }

  const segments = working.split(separator).filter(Boolean);
  const depth = segments.length;

  if (depth <= maxDepth) {
    return { original: path, collapsed: path, depth, wasCollapsed: false };
  }

  const kept = segments.slice(0, maxDepth);
  const collapsed = separator + kept.join(separator) + separator + '...';

  return { original: path, collapsed, depth, wasCollapsed: true };
}

export function collapseChange(
  change: RouteChange,
  config: CollapseConfig = {}
): RouteChange & { collapseResult?: CollapseResult } {
  const result = collapsePath(change.path, config);
  return { ...change, path: result.collapsed, collapseResult: result };
}

export function collapseChanges(
  changes: RouteChange[],
  config: CollapseConfig = {}
): Array<RouteChange & { collapseResult?: CollapseResult }> {
  return changes.map((c) => collapseChange(c, config));
}

export function formatCollapseText(
  results: CollapseResult[],
  label = 'Collapse'
): string {
  const collapsed = results.filter((r) => r.wasCollapsed);
  const lines: string[] = [
    `[${label}] ${results.length} path(s) processed, ${collapsed.length} collapsed`,
  ];
  for (const r of collapsed) {
    lines.push(`  ${r.original} → ${r.collapsed} (depth ${r.depth})`);
  }
  return lines.join('\n');
}
