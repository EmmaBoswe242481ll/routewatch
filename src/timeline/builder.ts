import { RouteChange } from '../diff/types';
import { TimelineEntry, Timeline, TimelineOptions } from './types';

export function buildTimelineEntry(
  commitHash: string,
  commitDate: string,
  changes: RouteChange[],
  label?: string
): TimelineEntry {
  return {
    commitHash,
    commitDate,
    label: label ?? commitHash.slice(0, 7),
    added: changes.filter(c => c.type === 'added').length,
    removed: changes.filter(c => c.type === 'removed').length,
    modified: changes.filter(c => c.type === 'modified').length,
    total: changes.length,
    routes: changes.map(c => ({
      key: `${c.method} ${c.path}`,
      type: c.type,
    })),
  };
}

export function buildTimeline(
  entries: TimelineEntry[],
  options: TimelineOptions = {}
): Timeline {
  const { limit, since, until } = options;

  let filtered = [...entries].sort(
    (a, b) => new Date(a.commitDate).getTime() - new Date(b.commitDate).getTime()
  );

  if (since) {
    const sinceTime = new Date(since).getTime();
    filtered = filtered.filter(e => new Date(e.commitDate).getTime() >= sinceTime);
  }

  if (until) {
    const untilTime = new Date(until).getTime();
    filtered = filtered.filter(e => new Date(e.commitDate).getTime() <= untilTime);
  }

  if (limit && limit > 0) {
    filtered = filtered.slice(-limit);
  }

  return {
    entries: filtered,
    totalEntries: filtered.length,
    totalChanges: filtered.reduce((sum, e) => sum + e.total, 0),
  };
}

export function formatTimelineText(timeline: Timeline): string {
  if (timeline.entries.length === 0) {
    return 'No timeline entries found.';
  }

  const lines: string[] = ['Route Change Timeline', '=====================', ''];

  for (const entry of timeline.entries) {
    lines.push(`[${entry.label}] ${entry.commitDate}`);
    lines.push(
      `  +${entry.added} added  -${entry.removed} removed  ~${entry.modified} modified`
    );
    for (const r of entry.routes) {
      const symbol = r.type === 'added' ? '+' : r.type === 'removed' ? '-' : '~';
      lines.push(`  ${symbol} ${r.key}`);
    }
    lines.push('');
  }

  lines.push(`Total: ${timeline.totalEntries} commits, ${timeline.totalChanges} changes`);
  return lines.join('\n');
}
