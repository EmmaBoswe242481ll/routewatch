import { RouteChange } from '../diff/types';

export interface MergeConfig {
  strategy: 'union' | 'intersection' | 'left' | 'right';
  deduplicateByKey?: boolean;
}

export interface MergeResult {
  changes: RouteChange[];
  leftCount: number;
  rightCount: number;
  mergedCount: number;
  strategy: MergeConfig['strategy'];
}

function changeKey(c: RouteChange): string {
  return `${c.method}:${c.path}:${c.type}`;
}

export function mergeChangeSets(
  left: RouteChange[],
  right: RouteChange[],
  config: MergeConfig
): MergeResult {
  let merged: RouteChange[];

  if (config.strategy === 'left') {
    merged = [...left];
  } else if (config.strategy === 'right') {
    merged = [...right];
  } else if (config.strategy === 'intersection') {
    const leftKeys = new Set(left.map(changeKey));
    merged = right.filter(c => leftKeys.has(changeKey(c)));
  } else {
    merged = [...left, ...right];
  }

  if (config.deduplicateByKey) {
    const seen = new Set<string>();
    merged = merged.filter(c => {
      const k = changeKey(c);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  return {
    changes: merged,
    leftCount: left.length,
    rightCount: right.length,
    mergedCount: merged.length,
    strategy: config.strategy,
  };
}

export function formatMergeText(result: MergeResult): string {
  const lines: string[] = [
    `Merge Strategy : ${result.strategy}`,
    `Left Changes   : ${result.leftCount}`,
    `Right Changes  : ${result.rightCount}`,
    `Merged Total   : ${result.mergedCount}`,
  ];
  return lines.join('\n');
}
