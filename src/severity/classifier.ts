import { RouteChange, ChangeType } from '../diff/types';

export type SeverityLevel = 'critical' | 'warning' | 'info';

export interface SeverityResult {
  level: SeverityLevel;
  reason: string;
}

export interface ClassifiedChange {
  change: RouteChange;
  severity: SeverityResult;
}

const SEVERITY_MAP: Record<ChangeType, SeverityLevel> = {
  removed: 'critical',
  modified: 'warning',
  added: 'info',
};

const REASON_MAP: Record<ChangeType, string> = {
  removed: 'Route was removed and may break existing consumers',
  modified: 'Route signature changed and may require consumer updates',
  added: 'New route introduced with no breaking impact',
};

export function classifyChange(change: RouteChange): SeverityResult {
  const baseLevel = SEVERITY_MAP[change.type];
  const baseReason = REASON_MAP[change.type];

  if (
    change.type === 'modified' &&
    change.paramChanges &&
    change.paramChanges.removed.length > 0
  ) {
    return {
      level: 'critical',
      reason: `Required params removed: ${change.paramChanges.removed.join(', ')}`,
    };
  }

  if (
    change.type === 'modified' &&
    change.paramChanges &&
    change.paramChanges.added.length > 0
  ) {
    return {
      level: 'warning',
      reason: `New params added: ${change.paramChanges.added.join(', ')}`,
    };
  }

  return { level: baseLevel, reason: baseReason };
}

export function classifyChanges(changes: RouteChange[]): ClassifiedChange[] {
  return changes.map((change) => ({
    change,
    severity: classifyChange(change),
  }));
}

export function filterBySeverity(
  classified: ClassifiedChange[],
  minLevel: SeverityLevel
): ClassifiedChange[] {
  const order: SeverityLevel[] = ['info', 'warning', 'critical'];
  const minIndex = order.indexOf(minLevel);
  return classified.filter(
    (c) => order.indexOf(c.severity.level) >= minIndex
  );
}
