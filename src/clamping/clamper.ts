import type { RouteChange } from '../diff/types';
import type { ClampOptions, ClampResult } from './types';
import { buildClampResult } from './types';

/**
 * Clamps a list of route changes to a numeric window [min, max].
 * Changes are first sorted by path then sliced to the desired range.
 */
export function clampChanges(
  changes: RouteChange[],
  options: ClampOptions = {}
): ClampResult {
  const { min = 0, max } = options;
  const original = changes.length;

  const sorted = [...changes].sort((a, b) =>
    a.path.localeCompare(b.path)
  );

  const lower = Math.max(0, min);
  const upper = max !== undefined ? Math.min(sorted.length, max) : sorted.length;

  const clamped = lower <= upper ? sorted.slice(lower, upper) : [];

  return buildClampResult(clamped, original, { min, max });
}

export function formatClampText(result: ClampResult): string {
  const lines: string[] = [
    `Clamp Result`,
    `  Original : ${result.original}`,
    `  Kept     : ${result.changes.length}`,
    `  Clamped  : ${result.clamped}`,
    `  Range    : [${result.min ?? 0}, ${result.max ?? result.original}]`,
  ];
  return lines.join('\n');
}
