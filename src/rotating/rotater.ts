import { RotateConfig, RotatedChange, RotateSummary, buildRotateSummary } from './types';

interface RouteChange {
  path: string;
  method: string;
  changeType: string;
}

function toRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

function rotateSegments(path: string, shift: number): string {
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) return path;
  const n = segments.length;
  const s = ((shift % n) + n) % n;
  const rotated = [...segments.slice(s), ...segments.slice(0, s)];
  return '/' + rotated.join('/');
}

export function rotateChange(change: RouteChange, config: RotateConfig): RotatedChange {
  const shift = config.defaultShift ?? 1;
  let appliedShift = shift;
  let ruleMatched: string | undefined;

  for (const rule of config.rules) {
    if (toRegExp(rule.pattern).test(change.path)) {
      appliedShift = rule.shift;
      ruleMatched = rule.pattern;
      break;
    }
  }

  const rotated = rotateSegments(change.path, appliedShift);
  return {
    original: change.path,
    rotated,
    method: change.method,
    changeType: change.changeType,
    shift: appliedShift,
    ruleMatched,
  };
}

export function rotateChanges(changes: RouteChange[], config: RotateConfig): RotatedChange[] {
  return changes.map(c => rotateChange(c, config));
}

export function formatRotateText(changes: RotatedChange[]): string {
  const summary: RotateSummary = buildRotateSummary(changes);
  const lines: string[] = [
    `Rotate Summary: ${summary.rotated}/${summary.total} routes rotated`,
  ];
  for (const c of changes) {
    if (c.original !== c.rotated) {
      lines.push(`  [${c.method}] ${c.original} -> ${c.rotated} (shift=${c.shift})`);
    }
  }
  return lines.join('\n');
}
