import type { RouteChange } from '../diff/types';
import type { GraftRule, GraftedChange, GraftResult } from './types';

function toRegExp(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '[^/]');
  return new RegExp(`^${escaped}$`);
}

export function graftChange(
  change: RouteChange,
  rules: GraftRule[]
): GraftedChange | null {
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    const re = toRegExp(rule.sourcePattern);
    if (!re.test(change.path)) continue;
    if (rule.method && rule.method.toUpperCase() !== change.method.toUpperCase()) continue;

    const grafted = rule.transform
      ? rule.transform(change.path)
      : change.path.replace(re, rule.targetPattern);

    return {
      original: change.path,
      grafted,
      method: change.method,
      ruleIndex: i,
      transformed: grafted !== change.path,
    };
  }
  return null;
}

export function graftChanges(
  changes: RouteChange[],
  rules: GraftRule[]
): GraftResult {
  const grafted: GraftedChange[] = [];
  let ungrafted = 0;

  for (const change of changes) {
    const result = graftChange(change, rules);
    if (result) {
      grafted.push(result);
    } else {
      ungrafted++;
    }
  }

  return {
    changes: grafted,
    ungrafted,
    totalRules: rules.length,
  };
}

export function formatGraftText(result: GraftResult): string {
  if (result.changes.length === 0) {
    return 'No changes were grafted.';
  }
  const lines = result.changes.map(
    (c) =>
      `  [${c.method}] ${c.original} -> ${c.grafted}${
        c.transformed ? '' : ' (no-op)'
      }`
  );
  lines.unshift(`Grafted ${result.changes.length} change(s), ${result.ungrafted} ungrafted:`);
  return lines.join('\n');
}
