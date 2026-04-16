import { RouteChange } from '../diff/types';

export interface OwnerRule {
  pattern: string;
  owner: string;
  team?: string;
}

export interface OwnerMatch {
  route: string;
  method: string;
  owner: string;
  team?: string;
}

export interface OwnershipResult {
  matched: OwnerMatch[];
  unmatched: RouteChange[];
}

function toRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

export function resolveOwner(route: string, rules: OwnerRule[]): OwnerRule | undefined {
  for (const rule of rules) {
    if (toRegExp(rule.pattern).test(route)) {
      return rule;
    }
  }
  return undefined;
}

export function resolveOwnership(changes: RouteChange[], rules: OwnerRule[]): OwnershipResult {
  const matched: OwnerMatch[] = [];
  const unmatched: RouteChange[] = [];

  for (const change of changes) {
    const rule = resolveOwner(change.route, rules);
    if (rule) {
      matched.push({ route: change.route, method: change.method, owner: rule.owner, team: rule.team });
    } else {
      unmatched.push(change);
    }
  }

  return { matched, unmatched };
}

export function formatOwnershipText(result: OwnershipResult): string {
  const lines: string[] = ['Ownership Report', '================'];
  if (result.matched.length === 0 && result.unmatched.length === 0) {
    lines.push('No changes to report.');
    return lines.join('\n');
  }
  if (result.matched.length > 0) {
    lines.push('\nOwned Routes:');
    for (const m of result.matched) {
      const team = m.team ? ` (${m.team})` : '';
      lines.push(`  [${m.method}] ${m.route} — ${m.owner}${team}`);
    }
  }
  if (result.unmatched.length > 0) {
    lines.push('\nUnowned Routes:');
    for (const u of result.unmatched) {
      lines.push(`  [${u.method}] ${u.route}`);
    }
  }
  return lines.join('\n');
}
