import { RouteChange } from '../diff/types';

export interface LabelRule {
  pattern: string;
  label: string;
  methods?: string[];
}

export interface LabelOptions {
  rules: LabelRule[];
}

export interface LabeledChange extends RouteChange {
  labels: string[];
}

function toRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`, 'i');
}

export function labelChange(change: RouteChange, rules: LabelRule[]): LabeledChange {
  const labels: string[] = [];
  for (const rule of rules) {
    const re = toRegExp(rule.pattern);
    const pathToTest = change.path ?? (change as any).route ?? '';
    if (!re.test(pathToTest)) continue;
    if (rule.methods && rule.methods.length > 0) {
      const method = (change.method ?? '').toUpperCase();
      if (!rule.methods.map(m => m.toUpperCase()).includes(method)) continue;
    }
    labels.push(rule.label);
  }
  return { ...change, labels };
}

export function labelChanges(changes: RouteChange[], options: LabelOptions): LabeledChange[] {
  return changes.map(c => labelChange(c, options.rules));
}

export function groupByLabel(changes: LabeledChange[]): Record<string, LabeledChange[]> {
  const result: Record<string, LabeledChange[]> = {};
  for (const change of changes) {
    const labels = change.labels.length > 0 ? change.labels : ['unlabeled'];
    for (const label of labels) {
      if (!result[label]) result[label] = [];
      result[label].push(change);
    }
  }
  return result;
}

export function formatLabelText(changes: LabeledChange[]): string {
  const grouped = groupByLabel(changes);
  const lines: string[] = ['Route Labels:'];
  for (const [label, items] of Object.entries(grouped)) {
    lines.push(`  [${label}] (${items.length})`);
    for (const item of items) {
      lines.push(`    ${item.method ?? 'ANY'} ${(item as any).route ?? item.path ?? ''}`);
    }
  }
  return lines.join('\n');
}
