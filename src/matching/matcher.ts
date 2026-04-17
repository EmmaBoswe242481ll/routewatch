import { RouteChange } from '../parsers/types';

export interface MatchRule {
  pattern: string;
  label?: string;
}

export interface MatchResult {
  change: RouteChange;
  matched: boolean;
  label?: string;
  pattern?: string;
}

function toRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

export function matchChange(change: RouteChange, rules: MatchRule[]): MatchResult {
  for (const rule of rules) {
    const re = toRegExp(rule.pattern);
    if (re.test(change.path)) {
      return { change, matched: true, label: rule.label, pattern: rule.pattern };
    }
  }
  return { change, matched: false };
}

export function matchChanges(changes: RouteChange[], rules: MatchRule[]): MatchResult[] {
  return changes.map(c => matchChange(c, rules));
}

export function filterMatched(results: MatchResult[]): MatchResult[] {
  return results.filter(r => r.matched);
}

export function filterUnmatched(results: MatchResult[]): MatchResult[] {
  return results.filter(r => !r.matched);
}

export function formatMatchText(results: MatchResult[]): string {
  if (results.length === 0) return 'No match results.';
  const lines = results.map(r => {
    const tag = r.matched ? `[MATCH:${r.label ?? r.pattern}]` : '[NO MATCH]';
    return `  ${tag} ${r.change.method} ${r.change.path}`;
  });
  return `Match Results (${results.length}):\n${lines.join('\n')}`;
}
