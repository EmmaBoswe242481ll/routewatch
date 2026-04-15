import { analyzeTrends, buildTrendEntries, formatTrendText } from '../analyzer';
import { AuditEntry } from '../../audit/trail';

function makeEntry(
  timestamp: string,
  changes: Array<{ method: string; path: string; type: string }>
): AuditEntry {
  return {
    id: `entry-${timestamp}`,
    timestamp,
    fromRef: 'abc',
    toRef: 'def',
    changes,
  } as unknown as AuditEntry;
}

const now = new Date();
const recent = new Date(now);
recent.setDate(recent.getDate() - 5);
const old = new Date(now);
old.setDate(old.getDate() - 60);

describe('buildTrendEntries', () => {
  it('filters entries outside the window', () => {
    const entries = [
      makeEntry(recent.toISOString(), [{ method: 'GET', path: '/api/users', type: 'modified' }]),
      makeEntry(old.toISOString(), [{ method: 'POST', path: '/api/posts', type: 'added' }]),
    ];
    const result = buildTrendEntries(entries, 30);
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('/api/users');
  });

  it('accumulates change counts for the same route', () => {
    const entries = [
      makeEntry(recent.toISOString(), [{ method: 'GET', path: '/api/items', type: 'modified' }]),
      makeEntry(recent.toISOString(), [{ method: 'GET', path: '/api/items', type: 'removed' }]),
    ];
    const result = buildTrendEntries(entries, 30);
    expect(result).toHaveLength(1);
    expect(result[0].changeCount).toBe(2);
    expect(result[0].changeTypes).toContain('modified');
    expect(result[0].changeTypes).toContain('removed');
  });

  it('does not duplicate changeTypes', () => {
    const entries = [
      makeEntry(recent.toISOString(), [{ method: 'GET', path: '/api/x', type: 'modified' }]),
      makeEntry(recent.toISOString(), [{ method: 'GET', path: '/api/x', type: 'modified' }]),
    ];
    const result = buildTrendEntries(entries, 30);
    expect(result[0].changeTypes).toHaveLength(1);
  });
});

describe('analyzeTrends', () => {
  it('returns a TrendReport with correct windowDays', () => {
    const report = analyzeTrends([], { windowDays: 14 });
    expect(report.windowDays).toBe(14);
    expect(report.entries).toHaveLength(0);
    expect(report.mostChanged).toBeNull();
  });

  it('respects minChangeCount filter', () => {
    const entries = [
      makeEntry(recent.toISOString(), [{ method: 'GET', path: '/api/a', type: 'modified' }]),
      makeEntry(recent.toISOString(), [{ method: 'GET', path: '/api/a', type: 'added' }]),
      makeEntry(recent.toISOString(), [{ method: 'POST', path: '/api/b', type: 'added' }]),
    ];
    const report = analyzeTrends(entries, { minChangeCount: 2 });
    expect(report.entries).toHaveLength(1);
    expect(report.entries[0].path).toBe('/api/a');
  });

  it('identifies mostChanged correctly', () => {
    const entries = [
      makeEntry(recent.toISOString(), [{ method: 'GET', path: '/api/hot', type: 'modified' }]),
      makeEntry(recent.toISOString(), [{ method: 'GET', path: '/api/hot', type: 'modified' }]),
      makeEntry(recent.toISOString(), [{ method: 'DELETE', path: '/api/cold', type: 'removed' }]),
    ];
    const report = analyzeTrends(entries);
    expect(report.mostChanged?.path).toBe('/api/hot');
  });

  it('respects limit option', () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeEntry(recent.toISOString(), [{ method: 'GET', path: `/api/route${i}`, type: 'modified' }])
    );
    const report = analyzeTrends(entries, { limit: 3 });
    expect(report.entries.length).toBeLessThanOrEqual(3);
  });
});

describe('formatTrendText', () => {
  it('includes header and entry lines', () => {
    const entries = [
      makeEntry(recent.toISOString(), [{ method: 'GET', path: '/api/test', type: 'modified' }]),
    ];
    const report = analyzeTrends(entries);
    const text = formatTrendText(report);
    expect(text).toContain('Trend Report');
    expect(text).toContain('/api/test');
    expect(text).toContain('GET');
  });

  it('handles empty report gracefully', () => {
    const report = analyzeTrends([]);
    const text = formatTrendText(report);
    expect(text).toContain('Total trending routes: 0');
  });
});
