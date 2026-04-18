export type SquashGroupBy = 'path' | 'method' | 'both';

export interface SquashConfig {
  enabled: boolean;
  groupBy: SquashGroupBy;
  keepLast: boolean;
}

export function defaultSquashConfig(): SquashConfig {
  return {
    enabled: true,
    groupBy: 'both',
    keepLast: true,
  };
}

export function buildSquashSummary(original: number, squashed: number): string {
  const removed = original - squashed;
  const pct = original > 0 ? ((removed / original) * 100).toFixed(1) : '0.0';
  return `Squashed ${removed} of ${original} changes (${pct}% reduction)`;
}
