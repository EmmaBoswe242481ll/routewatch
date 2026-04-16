import {
  buildTimelineEntry,
  buildTimeline,
  formatTimelineText,
} from '../builder';
import { RouteChange } from '../../diff/types';

function makeChange(type: 'added' | 'removed' | 'modified', path: string): RouteChange {
  return { type, method: 'GET', path, params: [] } as RouteChange;
}

describe('buildTimelineEntry', () => {
  it('counts changes by type', () => {
    const changes = [
      makeChange('added', '/api/users'),
      makeChange('removed', '/api/old'),
      makeChange('modified', '/api/posts'),
    ];
    const entry = buildTimelineEntry('abc1234', '2024-01-01', changes);
    expect(entry.added).toBe(1);
    expect(entry.removed).toBe(1);
    expect(entry.modified).toBe(1);
    expect(entry.total).toBe(3);
  });

  it('uses short hash as default label', () => {
    const entry = buildTimelineEntry('abc1234567', '2024-01-01', []);
    expect(entry.label).toBe('abc1234');
  });

  it('uses provided label when given', () => {
    const entry = buildTimelineEntry('abc1234', '2024-01-01', [], 'v1.0.0');
    expect(entry.label).toBe('v1.0.0');
  });
});

describe('buildTimeline', () => {
  const entries = [
    { commitHash: 'a', commitDate: '2024-01-01', label: 'a', added: 1, removed: 0, modified: 0, total: 1, routes: [] },
    { commitHash: 'b', commitDate: '2024-03-01', label: 'b', added: 2, removed: 1, modified: 0, total: 3, routes: [] },
    { commitHash: 'c', commitDate: '2024-06-01', label: 'c', added: 0, removed: 0, modified: 2, total: 2, routes: [] },
  ];

  it('returns all entries sorted by date', () => {
    const timeline = buildTimeline(entries);
    expect(timeline.entries).toHaveLength(3);
    expect(timeline.totalChanges).toBe(6);
  });

  it('respects limit option', () => {
    const timeline = buildTimeline(entries, { limit: 2 });
    expect(timeline.entries).toHaveLength(2);
    expect(timeline.entries[0].commitHash).toBe('b');
  });

  it('filters by since', () => {
    const timeline = buildTimeline(entries, { since: '2024-02-01' });
    expect(timeline.entries).toHaveLength(2);
    expect(timeline.entries[0].commitHash).toBe('b');
  });

  it('filters by until', () => {
    const timeline = buildTimeline(entries, { until: '2024-04-01' });
    expect(timeline.entries).toHaveLength(2);
  });
});

describe('formatTimelineText', () => {
  it('returns message when no entries', () => {
    const text = formatTimelineText({ entries: [], totalEntries: 0, totalChanges: 0 });
    expect(text).toContain('No timeline entries found.');
  });

  it('includes commit label and counts', () => {
    const entry = buildTimelineEntry('abc1234', '2024-01-01', [makeChange('added', '/api/v1')]);
    const text = formatTimelineText({ entries: [entry], totalEntries: 1, totalChanges: 1 });
    expect(text).toContain('abc1234');
    expect(text).toContain('+1 added');
    expect(text).toContain('+ GET /api/v1');
  });
});
