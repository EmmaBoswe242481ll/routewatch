import crypto from 'crypto';
import { TraceRule, TracedChange, TraceResult } from './types';

function toRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

function generateTraceId(path: string, method: string, changeType: string): string {
  const raw = `${method}:${path}:${changeType}:${Date.now()}`;
  return crypto.createHash('sha1').update(raw).digest('hex').slice(0, 12);
}

function findMatchingRule(path: string, rules: TraceRule[]): TraceRule | undefined {
  return rules.find(rule => toRegExp(rule.pattern).test(path));
}

export function traceChange(
  change: { path: string; method: string; changeType: string },
  rules: TraceRule[]
): TracedChange | null {
  const rule = findMatchingRule(change.path, rules);
  if (!rule) return null;
  return {
    path: change.path,
    method: change.method,
    changeType: change.changeType,
    traceId: generateTraceId(change.path, change.method, change.changeType),
    label: rule.label,
    tracedAt: new Date().toISOString(),
  };
}

export function traceChanges(
  changes: Array<{ path: string; method: string; changeType: string }>,
  rules: TraceRule[]
): TraceResult {
  const traced: TracedChange[] = [];
  let untraced = 0;
  for (const change of changes) {
    const result = traceChange(change, rules);
    if (result) {
      traced.push(result);
    } else {
      untraced++;
    }
  }
  return { traced, untraced, totalInput: changes.length };
}

export function formatTraceText(result: TraceResult): string {
  if (result.traced.length === 0) {
    return 'No changes matched tracing rules.';
  }
  const lines = result.traced.map(
    t => `[${t.traceId}] ${t.method} ${t.path} (${t.changeType})${t.label ? ` — ${t.label}` : ''}`
  );
  lines.push(`\nTraced: ${result.traced.length}, Untraced: ${result.untraced}`);
  return lines.join('\n');
}
