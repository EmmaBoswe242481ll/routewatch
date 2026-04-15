import { RouteChange } from '../diff/types';
import { RouteDiff } from '../diff/types';

export interface RouteMetrics {
  totalRoutes: number;
  addedRoutes: number;
  removedRoutes: number;
  modifiedRoutes: number;
  breakingChanges: number;
  nonBreakingChanges: number;
  changeRate: number; // percentage of routes changed
  methodBreakdown: Record<string, number>;
  topChangedPaths: string[];
}

export function collectMetrics(diff: RouteDiff): RouteMetrics {
  const { added, removed, modified, unchanged } = diff;

  const totalRoutes = added.length + removed.length + modified.length + unchanged.length;
  const addedRoutes = added.length;
  const removedRoutes = removed.length;
  const modifiedRoutes = modified.length;

  const breakingChanges = [...removed, ...modified].filter((c) => {
    if ('changeType' in c) return c.changeType === 'breaking';
    return true;
  }).length;

  const nonBreakingChanges =
    addedRoutes + modifiedRoutes - breakingChanges;

  const totalChanged = addedRoutes + removedRoutes + modifiedRoutes;
  const changeRate =
    totalRoutes > 0 ? Math.round((totalChanged / totalRoutes) * 100) : 0;

  const methodBreakdown: Record<string, number> = {};
  const allChanges: RouteChange[] = [...added, ...removed, ...modified];
  for (const change of allChanges) {
    const method = change.route.method.toUpperCase();
    methodBreakdown[method] = (methodBreakdown[method] ?? 0) + 1;
  }

  const pathCounts: Record<string, number> = {};
  for (const change of allChanges) {
    const path = change.route.path;
    pathCounts[path] = (pathCounts[path] ?? 0) + 1;
  }
  const topChangedPaths = Object.entries(pathCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([path]) => path);

  return {
    totalRoutes,
    addedRoutes,
    removedRoutes,
    modifiedRoutes,
    breakingChanges,
    nonBreakingChanges,
    changeRate,
    methodBreakdown,
    topChangedPaths,
  };
}

export function formatMetricsText(metrics: RouteMetrics): string {
  const lines: string[] = [
    '=== Route Metrics ===',
    `Total Routes:      ${metrics.totalRoutes}`,
    `Added:             ${metrics.addedRoutes}`,
    `Removed:           ${metrics.removedRoutes}`,
    `Modified:          ${metrics.modifiedRoutes}`,
    `Breaking Changes:  ${metrics.breakingChanges}`,
    `Non-Breaking:      ${metrics.nonBreakingChanges}`,
    `Change Rate:       ${metrics.changeRate}%`,
    '',
    'Method Breakdown:',
    ...Object.entries(metrics.methodBreakdown).map(
      ([m, c]) => `  ${m}: ${c}`
    ),
  ];

  if (metrics.topChangedPaths.length > 0) {
    lines.push('', 'Top Changed Paths:');
    metrics.topChangedPaths.forEach((p, i) => lines.push(`  ${i + 1}. ${p}`));
  }

  return lines.join('\n');
}
