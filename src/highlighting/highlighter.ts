import { RouteChange } from '../diff/types';

export interface HighlightRule {
  field: 'path' | 'method' | 'changeType';
  pattern: string;
  color: string;
  label?: string;
}

export interface HighlightResult {
  change: RouteChange;
  highlights: Array<{ field: string; color: string; label?: string }>;
}

function toRegExp(pattern: string): RegExp {
  try {
    return new RegExp(pattern, 'i');
  } catch {
    return new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }
}

export function highlightChange(
  change: RouteChange,
  rules: HighlightRule[]
): HighlightResult {
  const highlights: HighlightResult['highlights'] = [];

  for (const rule of rules) {
    const value =
      rule.field === 'path'
        ? change.route.path
        : rule.field === 'method'
        ? change.route.method
        : change.type;

    if (toRegExp(rule.pattern).test(value)) {
      highlights.push({ field: rule.field, color: rule.color, label: rule.label });
    }
  }

  return { change, highlights };
}

export function highlightChanges(
  changes: RouteChange[],
  rules: HighlightRule[]
): HighlightResult[] {
  return changes.map((c) => highlightChange(c, rules));
}

export function formatHighlightText(results: HighlightResult[]): string {
  if (results.length === 0) return 'No highlighted changes.';
  const lines: string[] = ['Highlighted Changes:', ''];
  for (const { change, highlights } of results) {
    const tags = highlights.length
      ? highlights.map((h) => `[${h.color}${h.label ? ':' + h.label : ''}]`).join(' ')
      : '[none]';
    lines.push(`  ${change.type.toUpperCase()} ${change.route.method} ${change.route.path} ${tags}`);
  }
  return lines.join('\n');
}
