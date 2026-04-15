import { collectMetrics, formatMetricsText } from '../collector';
import { RouteDiff } from '../../diff/types';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, method: string, changeType: 'breaking' | 'non-breaking' = 'non-breaking'): RouteChange {
  return {
    route: { path, method, params: [], framework: 'express', filePath: 'app.ts' },
    changeType,
  } as any;
}

function makeDiff(overrides: Partial<RouteDiff> = {}): RouteDiff {
  return {
    added: [],
    removed: [],
    modified: [],
    unchanged: [],
    ...overrides,
  };
}

describe('collectMetrics', () => {
  it('returns zero metrics for empty diff', () => {
    const metrics = collectMetrics(makeDiff());
    expect(metrics.totalRoutes).toBe(0);
    expect(metrics.changeRate).toBe(0);
    expect(metrics.addedRoutes).toBe(0);
    expect(metrics.breakingChanges).toBe(0);
  });

  it('counts added, removed, and modified routes', () => {
    const diff = makeDiff({
      added: [makeChange('/users', 'GET')],
      removed: [makeChange('/posts', 'DELETE')],
      modified: [makeChange('/items', 'PUT', 'breaking')],
      unchanged: [makeChange('/health', 'GET')],
    });
    const metrics = collectMetrics(diff);
    expect(metrics.totalRoutes).toBe(4);
    expect(metrics.addedRoutes).toBe(1);
    expect(metrics.removedRoutes).toBe(1);
    expect(metrics.modifiedRoutes).toBe(1);
  });

  it('calculates change rate correctly', () => {
    const diff = makeDiff({
      added: [makeChange('/a', 'GET')],
      removed: [makeChange('/b', 'POST')],
      unchanged: [makeChange('/c', 'GET'), makeChange('/d', 'GET')],
    });
    const metrics = collectMetrics(diff);
    expect(metrics.changeRate).toBe(50);
  });

  it('counts breaking changes from removed and modified', () => {
    const diff = makeDiff({
      removed: [makeChange('/old', 'GET')],
      modified: [makeChange('/item', 'PUT', 'breaking')],
    });
    const metrics = collectMetrics(diff);
    expect(metrics.breakingChanges).toBe(2);
  });

  it('builds method breakdown', () => {
    const diff = makeDiff({
      added: [makeChange('/a', 'GET'), makeChange('/b', 'GET')],
      removed: [makeChange('/c', 'POST')],
    });
    const metrics = collectMetrics(diff);
    expect(metrics.methodBreakdown['GET']).toBe(2);
    expect(metrics.methodBreakdown['POST']).toBe(1);
  });

  it('returns top changed paths limited to 5', () => {
    const paths = ['/a', '/b', '/c', '/d', '/e', '/f'];
    const added = paths.map((p) => makeChange(p, 'GET'));
    const metrics = collectMetrics(makeDiff({ added }));
    expect(metrics.topChangedPaths.length).toBe(5);
  });
});

describe('formatMetricsText', () => {
  it('includes key metric labels', () => {
    const metrics = collectMetrics(makeDiff({
      added: [makeChange('/x', 'GET')],
    }));
    const text = formatMetricsText(metrics);
    expect(text).toContain('Route Metrics');
    expect(text).toContain('Added:');
    expect(text).toContain('Change Rate:');
    expect(text).toContain('GET');
  });

  it('lists top changed paths when present', () => {
    const metrics = collectMetrics(makeDiff({
      added: [makeChange('/api/users', 'GET')],
    }));
    const text = formatMetricsText(metrics);
    expect(text).toContain('/api/users');
  });
});
