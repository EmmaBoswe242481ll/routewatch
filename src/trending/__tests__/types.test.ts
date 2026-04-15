import { TrendEntry, TrendReport, TrendOptions } from '../types';

describe('TrendEntry shape', () => {
  it('accepts a valid TrendEntry object', () => {
    const entry: TrendEntry = {
      routeKey: 'GET:/api/users',
      method: 'GET',
      path: '/api/users',
      changeCount: 3,
      firstSeen: '2024-01-01T00:00:00.000Z',
      lastSeen: '2024-01-10T00:00:00.000Z',
      changeTypes: ['modified', 'added'],
    };
    expect(entry.routeKey).toBe('GET:/api/users');
    expect(entry.changeCount).toBe(3);
    expect(entry.changeTypes).toHaveLength(2);
  });
});

describe('TrendReport shape', () => {
  it('accepts a valid TrendReport with null fields', () => {
    const report: TrendReport = {
      generatedAt: new Date().toISOString(),
      windowDays: 30,
      entries: [],
      mostChanged: null,
      mostVolatile: null,
    };
    expect(report.entries).toHaveLength(0);
    expect(report.mostChanged).toBeNull();
  });
});

describe('TrendOptions defaults', () => {
  it('allows partial options', () => {
    const opts: TrendOptions = { windowDays: 7 };
    expect(opts.windowDays).toBe(7);
    expect(opts.minChangeCount).toBeUndefined();
    expect(opts.sortBy).toBeUndefined();
    expect(opts.limit).toBeUndefined();
  });

  it('accepts all sortBy variants', () => {
    const a: TrendOptions = { sortBy: 'changeCount' };
    const b: TrendOptions = { sortBy: 'lastSeen' };
    const c: TrendOptions = { sortBy: 'firstSeen' };
    expect(a.sortBy).toBe('changeCount');
    expect(b.sortBy).toBe('lastSeen');
    expect(c.sortBy).toBe('firstSeen');
  });
});
