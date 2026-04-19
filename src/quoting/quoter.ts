import { RouteChange } from '../diff/types';

export interface QuoteRule {
  pattern: string;
  template: string;
  fields?: string[];
}

export interface QuoteOptions {
  rules: QuoteRule[];
  defaultTemplate?: string;
  escape?: boolean;
}

export interface QuotedChange {
  change: RouteChange;
  quote: string;
  template: string;
}

function toRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

function escapeValue(value: string, escape: boolean): string {
  if (!escape) return value;
  return value.replace(/"/g, '\\"').replace(/'/g, "\\'");
}

function applyTemplate(template: string, change: RouteChange, escape: boolean): string {
  return template
    .replace(/\{method\}/g, escapeValue(change.method, escape))
    .replace(/\{path\}/g, escapeValue(change.path, escape))
    .replace(/\{type\}/g, escapeValue(change.type, escape));
}

export function quoteChange(change: RouteChange, options: QuoteOptions): QuotedChange {
  for (const rule of options.rules) {
    if (toRegExp(rule.pattern).test(change.path)) {
      const quote = applyTemplate(rule.template, change, options.escape ?? false);
      return { change, quote, template: rule.template };
    }
  }
  const defaultTemplate = options.defaultTemplate ?? '{method} {path}';
  const quote = applyTemplate(defaultTemplate, change, options.escape ?? false);
  return { change, quote, template: defaultTemplate };
}

export function quoteChanges(changes: RouteChange[], options: QuoteOptions): QuotedChange[] {
  return changes.map(c => quoteChange(c, options));
}

export function formatQuoteText(quoted: QuotedChange[]): string {
  if (quoted.length === 0) return 'No quoted changes.';
  const lines = quoted.map(q => `[${q.change.type}] ${q.quote}`);
  return `Quoted Changes (${quoted.length}):\n` + lines.join('\n');
}
