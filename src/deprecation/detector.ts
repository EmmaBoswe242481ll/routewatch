import { RouteChange } from '../diff/types';
import { TaggedRoute } from '../tags/types';

export interface DeprecationRule {
  pattern: string;
  reason?: string;
  since?: string;
  replacement?: string;
}

export interface DeprecatedRoute {
  route: string;
  method: string;
  reason: string;
  since?: string;
  replacement?: string;
  removedInCommit?: string;
}

export interface DeprecationReport {
  deprecated: DeprecatedRoute[];
  removed: DeprecatedRoute[];
  total: number;
}

export function matchesDeprecationRule(
  route: string,
  rule: DeprecationRule
): boolean {
  try {
    const regex = new RegExp(rule.pattern);
    return regex.test(route);
  } catch {
    return route.includes(rule.pattern);
  }
}

export function detectDeprecations(
  changes: RouteChange[],
  rules: DeprecationRule[]
): DeprecationReport {
  const deprecated: DeprecatedRoute[] = [];
  const removed: DeprecatedRoute[] = [];

  for (const change of changes) {
    const route = change.route;
    const method = change.method;

    for (const rule of rules) {
      if (!matchesDeprecationRule(route, rule)) continue;

      const entry: DeprecatedRoute = {
        route,
        method,
        reason: rule.reason ?? 'Matches deprecation pattern',
        since: rule.since,
        replacement: rule.replacement,
      };

      if (change.type === 'removed') {
        removed.push({ ...entry, removedInCommit: change.commit });
      } else {
        deprecated.push(entry);
      }
    }
  }

  return {
    deprecated,
    removed,
    total: deprecated.length + removed.length,
  };
}

/**
 * Returns all deprecation rules that did not match any route in the given changes.
 * Useful for identifying stale or misconfigured rules.
 */
export function findUnusedRules(
  changes: RouteChange[],
  rules: DeprecationRule[]
): DeprecationRule[] {
  return rules.filter(
    (rule) => !changes.some((change) => matchesDeprecationRule(change.route, rule))
  );
}

export function formatDeprecationText(report: DeprecationReport): string {
  const lines: string[] = ['## Deprecation Report'];

  if (report.total === 0) {
    lines.push('No deprecated or removed routes detected.');
    return lines.join('\n');
  }

  if (report.deprecated.length > 0) {
    lines.push(`\n### Deprecated (${report.deprecated.length})`);
    for (const d of report.deprecated) {
      lines.push(`- [${d.method}] ${d.route}`);
      lines.push(`  Reason: ${d.reason}`);
      if (d.since) lines.push(`  Since: ${d.since}`);
      if (d.replacement) lines.push(`  Use instead: ${d.replacement}`);
    }
  }

  if (report.removed.length > 0) {
    lines.push(`\n### Removed (${report.removed.length})`);
    for (const r of report.removed) {
      lines.push(`- [${r.method}] ${r.route}`);
      lines.push(`  Reason: ${r.reason}`);
      if (r.removedInCommit) lines.push(`  Removed at: ${r.removedInCommit}`);
      if (r.replacement) lines.push(`  Use instead: ${r.replacement}`);
    }
  }

  return lines.join('\n');
}
