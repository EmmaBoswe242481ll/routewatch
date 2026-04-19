import { RouteChange } from '../diff/types';

export interface FreezeRule {
  pattern: string;
  reason?: string;
}

export interface FreezeResult {
  frozen: RouteChange[];
  unfrozen: RouteChange[];
  rules: FreezeRule[];
}

function toRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

export function isFrozen(change: RouteChange, rules: FreezeRule[]): boolean {
  return rules.some(rule => toRegExp(rule.pattern).test(change.path));
}

export function freezeChanges(
  changes: RouteChange[],
  rules: FreezeRule[]
): FreezeResult {
  const frozen: RouteChange[] = [];
  const unfrozen: RouteChange[] = [];

  for (const change of changes) {
    if (isFrozen(change, rules)) {
      frozen.push(change);
    } else {
      unfrozen.push(change);
    }
  }

  return { frozen, unfrozen, rules };
}

export function formatFreezeText(result: FreezeResult): string {
  const lines: string[] = [`Freeze Report: ${result.frozen.length} frozen, ${result.unfrozen.length} unfrozen`];
  if (result.frozen.length > 0) {
    lines.push('Frozen routes:');
    for (const c of result.frozen) {
      const rule = result.rules.find(r => toRegExp(r.pattern).test(c.path));
      const reason = rule?.reason ? ` (${rule.reason})` : '';
      lines.push(`  [${c.method}] ${c.path}${reason}`);
    }
  }
  return lines.join('\n');
}
