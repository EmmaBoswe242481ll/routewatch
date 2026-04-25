import { RouteChange } from '../diff/types';

export interface SealRule {
  pattern: string;
  reason?: string;
}

export interface SealResult {
  change: RouteChange;
  sealed: boolean;
  reason?: string;
}

export interface SealSummary {
  total: number;
  sealed: number;
  unsealed: number;
}

function toRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

export function isSealed(change: RouteChange, rules: SealRule[]): SealRule | undefined {
  return rules.find((rule) => {
    const re = toRegExp(rule.pattern);
    return re.test(change.path);
  });
}

export function sealChanges(
  changes: RouteChange[],
  rules: SealRule[]
): SealResult[] {
  return changes.map((change) => {
    const matched = isSealed(change, rules);
    if (matched) {
      return { change, sealed: true, reason: matched.reason };
    }
    return { change, sealed: false };
  });
}

export function filterUnsealed(results: SealResult[]): RouteChange[] {
  return results.filter((r) => !r.sealed).map((r) => r.change);
}

export function buildSealSummary(results: SealResult[]): SealSummary {
  const sealed = results.filter((r) => r.sealed).length;
  return {
    total: results.length,
    sealed,
    unsealed: results.length - sealed,
  };
}

export function formatSealText(summary: SealSummary): string {
  const lines: string[] = [
    `Sealing Summary`,
    `  Total   : ${summary.total}`,
    `  Sealed  : ${summary.sealed}`,
    `  Unsealed: ${summary.unsealed}`,
  ];
  return lines.join('\n');
}
