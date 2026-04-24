import { RouteChange } from '../diff/types';

export interface ForkRule {
  match: string | RegExp;
  targets: string[];
}

export interface ForkResult {
  original: RouteChange;
  forks: RouteChange[];
  targetCount: number;
}

export interface ForkSummary {
  total: number;
  forked: number;
  unforked: number;
  totalForks: number;
}

function toRegExp(pattern: string | RegExp): RegExp {
  return pattern instanceof RegExp ? pattern : new RegExp(pattern);
}

export function forkChange(
  change: RouteChange,
  rules: ForkRule[]
): ForkResult {
  for (const rule of rules) {
    const re = toRegExp(rule.match);
    const path = change.path ?? (change.before?.path || change.after?.path || '');
    if (re.test(path)) {
      const forks: RouteChange[] = rule.targets.map((target) => ({
        ...change,
        before: change.before ? { ...change.before, path: target } : undefined,
        after: change.after ? { ...change.after, path: target } : undefined,
      }));
      return { original: change, forks, targetCount: rule.targets.length };
    }
  }
  return { original: change, forks: [], targetCount: 0 };
}

export function forkChanges(
  changes: RouteChange[],
  rules: ForkRule[]
): ForkResult[] {
  return changes.map((c) => forkChange(c, rules));
}

export function flattenForks(results: ForkResult[]): RouteChange[] {
  return results.flatMap((r) => (r.forks.length > 0 ? r.forks : [r.original]));
}

export function buildForkSummary(results: ForkResult[]): ForkSummary {
  const forked = results.filter((r) => r.forks.length > 0).length;
  return {
    total: results.length,
    forked,
    unforked: results.length - forked,
    totalForks: results.reduce((sum, r) => sum + r.forks.length, 0),
  };
}

export function formatForkText(summary: ForkSummary): string {
  return [
    `Forking Summary`,
    `  Total changes : ${summary.total}`,
    `  Forked        : ${summary.forked}`,
    `  Unforked      : ${summary.unforked}`,
    `  Total forks   : ${summary.totalForks}`,
  ].join('\n');
}
