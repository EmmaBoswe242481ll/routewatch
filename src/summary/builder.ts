import { RouteDiff } from '../diff/types';
import { RouteSummary, SummaryOptions, SummaryResult } from './types';

export function buildSummary(
  diffs: RouteDiff[],
  fromRef: string,
  toRef: string,
  options: SummaryOptions = {}
): SummaryResult {
  const summary: RouteSummary = {
    totalRoutes: diffs.length,
    addedRoutes: 0,
    removedRoutes: 0,
    modifiedRoutes: 0,
    unchangedRoutes: 0,
    breakingChanges: 0,
    byMethod: {},
    byFramework: {},
  };

  for (const diff of diffs) {
    switch (diff.type) {
      case 'added':
        summary.addedRoutes++;
        break;
      case 'removed':
        summary.removedRoutes++;
        summary.breakingChanges++;
        break;
      case 'modified':
        summary.modifiedRoutes++;
        if (diff.paramChanges && diff.paramChanges.length > 0) {
          summary.breakingChanges++;
        }
        break;
      case 'unchanged':
        summary.unchangedRoutes++;
        break;
    }

    const route = diff.route ?? diff.before;
    if (route) {
      if (options.groupByMethod) {
        const method = route.method ?? 'UNKNOWN';
        summary.byMethod[method] = (summary.byMethod[method] ?? 0) + 1;
      }
      if (options.groupByFramework) {
        const fw = route.framework ?? 'unknown';
        summary.byFramework[fw] = (summary.byFramework[fw] ?? 0) + 1;
      }
    }
  }

  return {
    summary,
    fromRef,
    toRef,
    generatedAt: new Date().toISOString(),
  };
}

export function formatSummaryText(result: SummaryResult): string {
  const { summary, fromRef, toRef, generatedAt } = result;
  const lines: string[] = [
    `RouteWatch Summary — ${fromRef}..${toRef}`,
    `Generated: ${generatedAt}`,
    '',
    `Total Routes : ${summary.totalRoutes}`,
    `  Added      : ${summary.addedRoutes}`,
    `  Removed    : ${summary.removedRoutes}`,
    `  Modified   : ${summary.modifiedRoutes}`,
    `  Unchanged  : ${summary.unchangedRoutes}`,
    `Breaking     : ${summary.breakingChanges}`,
  ];

  if (Object.keys(summary.byMethod).length > 0) {
    lines.push('', 'By Method:');
    for (const [method, count] of Object.entries(summary.byMethod)) {
      lines.push(`  ${method.padEnd(8)}: ${count}`);
    }
  }

  if (Object.keys(summary.byFramework).length > 0) {
    lines.push('', 'By Framework:');
    for (const [fw, count] of Object.entries(summary.byFramework)) {
      lines.push(`  ${fw.padEnd(10)}: ${count}`);
    }
  }

  return lines.join('\n');
}
