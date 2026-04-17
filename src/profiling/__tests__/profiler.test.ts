import { profileChanges, formatProfileText } from '../profiler';
import { RouteChange } from '../../diff/types';

function makeChange(method: string, route: string): RouteChange {
  return { method, route, type: 'modified', before: null, after: null };
}

describe('profileChanges', () => {
  it('returns empty result for no history', () => {
    const result = profileChanges([]);
    expect(result.entries).toHaveLength(0);
    expect(result.totalRoutes).toBe(0);
    expect(result.mostChanged).toBeNull();
  });

  it('counts changes per route across runs', () => {
    const history = [
      { runAt: '2024-01-01T00:00:00Z', changes: [makeChange('GET', '/users'), makeChange('POST', '/users')] },
      { runAt: '2024-01-02T00:00:00Z', changes: [makeChange('GET', '/users')] },
    ];
    const result = profileChanges(history);
    expect(result.totalRoutes).toBe(2);
    const top = result.entries.find((e) => e.route === '/users' && e.method === 'GET');
    expect(top?.changeCount).toBe(2);
  });

  it('sets mostChanged to the highest change count entry', () => {
    const history = [
      { runAt: '2024-01-01T00:00:00Z', changes: [makeChange('DELETE', '/items'), makeChange('DELETE', '/items')] },
      { runAt: '2024-01-02T00:00:00Z', changes: [makeChange('DELETE', '/items'), makeChange('GET', '/health')] },
    ];
    const result = profileChanges(history);
    expect(result.mostChanged?.route).toBe('/items');
    expect(result.mostChanged?.method).toBe('DELETE');
  });

  it('computes avgChangesPerRun correctly', () => {
    const history = [
      { runAt: '2024-01-01T00:00:00Z', changes: [makeChange('GET', '/ping')] },
      { runAt: '2024-01-02T00:00:00Z', changes: [] },
      { runAt: '2024-01-03T00:00:00Z', changes: [makeChange('GET', '/ping')] },
    ];
    const result = profileChanges(history);
    const entry = result.entries[0];
    expect(entry.avgChangesPerRun).toBeCloseTo(0.67, 1);
  });

  it('tracks firstSeen and lastSeen', () => {
    const history = [
      { runAt: '2024-01-01T00:00:00Z', changes: [makeChange('GET', '/a')] },
      { runAt: '2024-01-05T00:00:00Z', changes: [makeChange('GET', '/a')] },
    ];
    const result = profileChanges(history);
    const entry = result.entries[0];
    expect(entry.firstSeen).toBe('2024-01-01T00:00:00Z');
    expect(entry.lastSeen).toBe('2024-01-05T00:00:00Z');
  });
});

describe('formatProfileText', () => {
  it('includes header and route info', () => {
    const history = [
      { runAt: '2024-01-01T00:00:00Z', changes: [makeChange('GET', '/users')] },
    ];
    const result = profileChanges(history);
    const text = formatProfileText(result);
    expect(text).toContain('Route Profile Report');
    expect(text).toContain('/users');
    expect(text).toContain('GET');
  });
});
