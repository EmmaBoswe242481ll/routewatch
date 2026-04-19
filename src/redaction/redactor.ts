import { RouteChange } from '../diff/types';

export interface RedactionRule {
  field: 'path' | 'method' | 'params';
  pattern: string;
  replacement?: string;
}

export interface RedactionOptions {
  rules: RedactionRule[];
  placeholder?: string;
}

export interface RedactionResult {
  change: RouteChange;
  redacted: boolean;
  fieldsRedacted: string[];
}

function toRegExp(pattern: string): RegExp {
  try {
    return new RegExp(pattern, 'i');
  } catch {
    return new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }
}

export function redactChange(
  change: RouteChange,
  options: RedactionOptions
): RedactionResult {
  const placeholder = options.placeholder ?? '[REDACTED]';
  const fieldsRedacted: string[] = [];
  let path = change.path;
  let method = change.method;

  for (const rule of options.rules) {
    const re = toRegExp(rule.pattern);
    const repl = rule.replacement ?? placeholder;
    if (rule.field === 'path' && re.test(path)) {
      path = path.replace(re, repl);
      fieldsRedacted.push('path');
    } else if (rule.field === 'method' && re.test(method)) {
      method = method.replace(re, repl);
      fieldsRedacted.push('method');
    }
  }

  return {
    change: { ...change, path, method },
    redacted: fieldsRedacted.length > 0,
    fieldsRedacted,
  };
}

export function redactChanges(
  changes: RouteChange[],
  options: RedactionOptions
): RedactionResult[] {
  return changes.map((c) => redactChange(c, options));
}

export function formatRedactionText(results: RedactionResult[]): string {
  const redacted = results.filter((r) => r.redacted).length;
  const lines = [`Redaction summary: ${redacted}/${results.length} changes redacted`];
  for (const r of results.filter((r) => r.redacted)) {
    lines.push(`  [${r.change.method}] ${r.change.path} — fields: ${r.fieldsRedacted.join(', ')}`);
  }
  return lines.join('\n');
}
