import { RouteChange } from '../diff/types';

export type MergeStrategy = 'union' | 'intersection' | 'left' | 'right';

export interface MergeOptions {
  strategy: MergeStrategy;
  deduplicateByKey?: boolean;
}

export interface MergeResult {
  changes: RouteChange[];
  leftCount: number;
  rightCount: number;
  mergedCount: number;
  strategy: MergeStrategy;
}

export function buildMergeSummary(result: MergeResult): string {
  return `[${result.strategy}] ${result.mergedCount} changes (left=${result.leftCount}, right=${result.rightCount})`;
}
