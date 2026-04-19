import { RouteChange } from '../diff/types';

export interface ScopeRule {
  name: string;
  prefixes: string[];
  methods?: string[];
}

export interface ScopeResult {
  scope: string;
  changes: RouteChange[];
}

export function matchesScope(change: RouteChange, rule: ScopeRule): boolean {
  const pathMatch = rule.prefixes.some(p => change.path.startsWith(p));
  if (!pathMatch) return false;
  if (rule.methods && rule.methods.length > 0) {
    return rule.methods.map(m => m.toUpperCase()).includes(change.method.toUpperCase());
  }
  return true;
}

export function scopeChanges(
  changes: RouteChange[],
  rules: ScopeRule[]
): ScopeResult[] {
  return rules.map(rule => ({
    scope: rule.name,
    changes: changes.filter(c => matchesScope(c, rule)),
  }));
}

export function unscopedChanges(
  changes: RouteChange[],
  rules: ScopeRule[]
): RouteChange[] {
  return changes.filter(c => !rules.some(rule => matchesScope(c, rule)));
}

export function formatScopeText(results: ScopeResult[]): string {
  const lines: string[] = ['Scope Results:'];
  for (const r of results) {
    lines.push(`  [${r.scope}] ${r.changes.length} change(s)`);
    for (const c of r.changes) {
      lines.push(`    ${c.method} ${c.path} (${c.type})`);
    }
  }
  return lines.join('\n');
}
