import { RouteChange } from '../diff/types';

export interface FlagRule {
  field: 'path' | 'method' | 'changeType';
  pattern: string;
  flag: string;
  reason?: string;
}

export interface FlaggedChange {
  change: RouteChange;
  flags: string[];
  reasons: string[];
}

export interface FlagResult {
  flagged: FlaggedChange[];
  clean: RouteChange[];
  totalFlags: number;
}

function toRegExp(pattern: string): RegExp {
  return new RegExp(pattern, 'i');
}

export function flagChange(change: RouteChange, rules: FlagRule[]): FlaggedChange | null {
  const flags: string[] = [];
  const reasons: string[] = [];

  for (const rule of rules) {
    const value = rule.field === 'changeType' ? change.type : (change as any)[rule.field] ?? '';
    if (toRegExp(rule.pattern).test(String(value))) {
      flags.push(rule.flag);
      if (rule.reason) reasons.push(rule.reason);
    }
  }

  if (flags.length === 0) return null;
  return { change, flags, reasons };
}

export function flagChanges(changes: RouteChange[], rules: FlagRule[]): FlagResult {
  const flagged: FlaggedChange[] = [];
  const clean: RouteChange[] = [];

  for (const change of changes) {
    const result = flagChange(change, rules);
    if (result) {
      flagged.push(result);
    } else {
      clean.push(change);
    }
  }

  return { flagged, clean, totalFlags: flagged.reduce((sum, f) => sum + f.flags.length, 0) };
}

export function formatFlagText(result: FlagResult): string {
  const lines: string[] = [`Flagged: ${result.flagged.length}, Clean: ${result.clean.length}, Total flags: ${result.totalFlags}`];
  for (const f of result.flagged) {
    lines.push(`  [${f.flags.join(', ')}] ${f.change.method} ${f.change.path}${
      f.reasons.length ? ' — ' + f.reasons.join('; ') : ''
    }`);
  }
  return lines.join('\n');
}
