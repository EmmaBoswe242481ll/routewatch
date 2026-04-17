import { RouteChange } from '../diff/types';

export interface ProfileEntry {
  route: string;
  method: string;
  changeCount: number;
  firstSeen: string;
  lastSeen: string;
  avgChangesPerRun: number;
}

export interface ProfileResult {
  entries: ProfileEntry[];
  totalRoutes: number;
  mostChanged: ProfileEntry | null;
  generatedAt: string;
}

export function profileChanges(
  history: Array<{ runAt: string; changes: RouteChange[] }>
): ProfileResult {
  const map = new Map<string, ProfileEntry>();

  for (const run of history) {
    for (const change of run.changes) {
      const key = `${change.method}:${change.route}`;
      const existing = map.get(key);
      if (existing) {
        existing.changeCount += 1;
        if (run.runAt > existing.lastSeen) existing.lastSeen = run.runAt;
        if (run.runAt < existing.firstSeen) existing.firstSeen = run.runAt;
      } else {
        map.set(key, {
          route: change.route,
          method: change.method,
          changeCount: 1,
          firstSeen: run.runAt,
          lastSeen: run.runAt,
          avgChangesPerRun: 0,
        });
      }
    }
  }

  const totalRuns = history.length || 1;
  const entries = Array.from(map.values()).map((e) => ({
    ...e,
    avgChangesPerRun: parseFloat((e.changeCount / totalRuns).toFixed(2)),
  }));

  entries.sort((a, b) => b.changeCount - a.changeCount);

  return {
    entries,
    totalRoutes: entries.length,
    mostChanged: entries[0] ?? null,
    generatedAt: new Date().toISOString(),
  };
}

export function formatProfileText(result: ProfileResult): string {
  const lines: string[] = ['Route Profile Report', '==================='];
  lines.push(`Total tracked routes: ${result.totalRoutes}`);
  if (result.mostChanged) {
    lines.push(
      `Most changed: ${result.mostChanged.method} ${result.mostChanged.route} (${result.mostChanged.changeCount}x)`
    );
  }
  lines.push('');
  for (const e of result.entries) {
    lines.push(
      `  ${e.method.padEnd(7)} ${e.route.padEnd(40)} changes: ${e.changeCount}  avg/run: ${e.avgChangesPerRun}`
    );
  }
  return lines.join('\n');
}
