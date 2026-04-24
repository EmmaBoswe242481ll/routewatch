import { RouteChange } from '../diff/types';

export interface SpanOptions {
  minDepth?: number;
  maxDepth?: number;
  includeWildcards?: boolean;
}

export interface SpanResult {
  change: RouteChange;
  depth: number;
  segments: string[];
  isWildcard: boolean;
}

export interface SpanSummary {
  total: number;
  minDepth: number;
  maxDepth: number;
  avgDepth: number;
  wildcardCount: number;
}

export function getPathDepth(path: string): number {
  return path.split('/').filter(Boolean).length;
}

export function getPathSegments(path: string): string[] {
  return path.split('/').filter(Boolean);
}

export function isWildcardSegment(segment: string): boolean {
  return segment.startsWith(':') || segment === '*' || segment === '**';
}

export function spanChange(change: RouteChange, options: SpanOptions = {}): SpanResult {
  const { includeWildcards = true } = options;
  const segments = getPathSegments(change.path);
  const depth = segments.length;
  const isWildcard = includeWildcards && segments.some(isWildcardSegment);

  return { change, depth, segments, isWildcard };
}

export function spanChanges(changes: RouteChange[], options: SpanOptions = {}): SpanResult[] {
  const { minDepth, maxDepth } = options;
  return changes
    .map(c => spanChange(c, options))
    .filter(r => {
      if (minDepth !== undefined && r.depth < minDepth) return false;
      if (maxDepth !== undefined && r.depth > maxDepth) return false;
      return true;
    });
}

export function buildSpanSummary(results: SpanResult[]): SpanSummary {
  if (results.length === 0) {
    return { total: 0, minDepth: 0, maxDepth: 0, avgDepth: 0, wildcardCount: 0 };
  }
  const depths = results.map(r => r.depth);
  const total = results.length;
  const minDepth = Math.min(...depths);
  const maxDepth = Math.max(...depths);
  const avgDepth = depths.reduce((a, b) => a + b, 0) / total;
  const wildcardCount = results.filter(r => r.isWildcard).length;
  return { total, minDepth, maxDepth, avgDepth, wildcardCount };
}

export function formatSpanText(results: SpanResult[]): string {
  const summary = buildSpanSummary(results);
  const lines: string[] = [
    `Span Analysis: ${summary.total} routes`,
    `Depth range: ${summary.minDepth}–${summary.maxDepth} (avg: ${summary.avgDepth.toFixed(2)})`,
    `Wildcard routes: ${summary.wildcardCount}`,
  ];
  for (const r of results) {
    const wc = r.isWildcard ? ' [wildcard]' : '';
    lines.push(`  [depth=${r.depth}] ${r.change.method} ${r.change.path}${wc}`);
  }
  return lines.join('\n');
}
