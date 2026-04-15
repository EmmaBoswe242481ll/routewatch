import { AuditEntry } from '../audit/trail';
import { TrendEntry, TrendReport, TrendOptions } from './types';

const DEFAULT_OPTIONS: Required<TrendOptions> = {
  windowDays: 30,
  minChangeCount: 1,
  sortBy: 'changeCount',
  limit: 20,
};

export function buildTrendEntries(
  entries: AuditEntry[],
  windowDays: number
): TrendEntry[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowDays);

  const map = new Map<string, TrendEntry>();

  for (const entry of entries) {
    const entryDate = new Date(entry.timestamp);
    if (entryDate < cutoff) continue;

    for (const change of entry.changes ?? []) {
      const key = `${change.method}:${change.path}`;
      const existing = map.get(key);

      if (existing) {
        existing.changeCount += 1;
        existing.lastSeen = entry.timestamp;
        if (!existing.changeTypes.includes(change.type)) {
          existing.changeTypes.push(change.type);
        }
      } else {
        map.set(key, {
          routeKey: key,
          method: change.method,
          path: change.path,
          changeCount: 1,
          firstSeen: entry.timestamp,
          lastSeen: entry.timestamp,
          changeTypes: [change.type],
        });
      }
    }
  }

  return Array.from(map.values());
}

export function analyzeTrends(
  entries: AuditEntry[],
  options: TrendOptions = {}
): TrendReport {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const trendEntries = buildTrendEntries(entries, opts.windowDays);

  const filtered = trendEntries.filter(
    (e) => e.changeCount >= opts.minChangeCount
  );

  const sorted = filtered.sort((a, b) => {
    if (opts.sortBy === 'changeCount') return b.changeCount - a.changeCount;
    if (opts.sortBy === 'lastSeen')
      return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
    return new Date(a.firstSeen).getTime() - new Date(b.firstSeen).getTime();
  });

  const limited = sorted.slice(0, opts.limit);

  const mostChanged =
    limited.reduce<TrendEntry | null>(
      (acc, e) => (!acc || e.changeCount > acc.changeCount ? e : acc),
      null
    );

  const mostVolatile =
    limited.reduce<TrendEntry | null>(
      (acc, e) =>
        !acc || e.changeTypes.length > acc.changeTypes.length ? e : acc,
      null
    );

  return {
    generatedAt: new Date().toISOString(),
    windowDays: opts.windowDays,
    entries: limited,
    mostChanged,
    mostVolatile,
  };
}

export function formatTrendText(report: TrendReport): string {
  const lines: string[] = [
    `Trend Report (last ${report.windowDays} days) — ${report.generatedAt}`,
    `Total trending routes: ${report.entries.length}`,
    '',
  ];

  if (report.mostChanged) {
    lines.push(`Most changed: ${report.mostChanged.routeKey} (${report.mostChanged.changeCount}x)`);
  }
  if (report.mostVolatile) {
    lines.push(`Most volatile: ${report.mostVolatile.routeKey} (${report.mostVolatile.changeTypes.join(', ')})`);
  }

  lines.push('');
  for (const entry of report.entries) {
    lines.push(
      `  ${entry.method.padEnd(7)} ${entry.path.padEnd(40)} changes=${entry.changeCount} types=[${entry.changeTypes.join(',')}]`
    );
  }

  return lines.join('\n');
}
