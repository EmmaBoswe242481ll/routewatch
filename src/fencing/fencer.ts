import { RouteChange } from '../diff/types';

export interface FenceRule {
  pattern: string;
  label: string;
  allowedMethods?: string[];
}

export interface FenceResult {
  change: RouteChange;
  label: string;
  allowed: boolean;
  reason?: string;
}

export interface FenceSummary {
  total: number;
  allowed: number;
  blocked: number;
  byLabel: Record<string, number>;
}

function toRegExp(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`);
}

export function fenceChange(
  change: RouteChange,
  rules: FenceRule[]
): FenceResult {
  for (const rule of rules) {
    const re = toRegExp(rule.pattern);
    const path = change.path ?? change.route ?? '';
    if (re.test(path)) {
      if (
        rule.allowedMethods &&
        rule.allowedMethods.length > 0 &&
        change.method &&
        !rule.allowedMethods.includes(change.method.toUpperCase())
      ) {
        return {
          change,
          label: rule.label,
          allowed: false,
          reason: `Method ${change.method} not allowed under fence "${rule.label}"`,
        };
      }
      return { change, label: rule.label, allowed: true };
    }
  }
  return { change, label: 'default', allowed: true };
}

export function fenceChanges(
  changes: RouteChange[],
  rules: FenceRule[]
): FenceResult[] {
  return changes.map((c) => fenceChange(c, rules));
}

export function buildFenceSummary(results: FenceResult[]): FenceSummary {
  const byLabel: Record<string, number> = {};
  let allowed = 0;
  let blocked = 0;
  for (const r of results) {
    byLabel[r.label] = (byLabel[r.label] ?? 0) + 1;
    if (r.allowed) allowed++;
    else blocked++;
  }
  return { total: results.length, allowed, blocked, byLabel };
}

export function formatFenceText(summary: FenceSummary): string {
  const lines: string[] = [
    `Fencing: ${summary.total} changes evaluated`,
    `  Allowed : ${summary.allowed}`,
    `  Blocked : ${summary.blocked}`,
  ];
  for (const [label, count] of Object.entries(summary.byLabel)) {
    lines.push(`  [${label}] ${count}`);
  }
  return lines.join('\n');
}
