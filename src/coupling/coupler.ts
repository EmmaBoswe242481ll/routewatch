import { RouteChange } from '../diff/types';

export interface CouplingRule {
  source: string;
  target: string;
  reason?: string;
}

export interface CoupledPair {
  source: RouteChange;
  target: RouteChange;
  reason: string;
}

export interface CouplingResult {
  pairs: CoupledPair[];
  uncoupled: RouteChange[];
  totalCoupled: number;
}

function toRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

export function findCoupledChanges(
  changes: RouteChange[],
  rules: CouplingRule[]
): CouplingResult {
  const pairs: CoupledPair[] = [];
  const coupledIndices = new Set<number>();

  for (const rule of rules) {
    const sourceRe = toRegExp(rule.source);
    const targetRe = toRegExp(rule.target);

    const sources = changes.filter(c => sourceRe.test(c.path));
    const targets = changes.filter(c => targetRe.test(c.path));

    for (const src of sources) {
      for (const tgt of targets) {
        if (src === tgt) continue;
        const srcIdx = changes.indexOf(src);
        const tgtIdx = changes.indexOf(tgt);
        pairs.push({
          source: src,
          target: tgt,
          reason: rule.reason ?? `Coupled via rule: ${rule.source} -> ${rule.target}`,
        });
        coupledIndices.add(srcIdx);
        coupledIndices.add(tgtIdx);
      }
    }
  }

  const uncoupled = changes.filter((_, i) => !coupledIndices.has(i));

  return {
    pairs,
    uncoupled,
    totalCoupled: coupledIndices.size,
  };
}

export function formatCouplingText(result: CouplingResult): string {
  const lines: string[] = [
    `Coupling Analysis: ${result.pairs.length} pair(s), ${result.totalCoupled} coupled route(s), ${result.uncoupled.length} uncoupled`,
  ];
  for (const pair of result.pairs) {
    lines.push(`  [${pair.source.method}] ${pair.source.path} <-> [${pair.target.method}] ${pair.target.path} — ${pair.reason}`);
  }
  return lines.join('\n');
}
