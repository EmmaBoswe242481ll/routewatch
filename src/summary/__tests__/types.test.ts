import type { RouteSummary, SummaryOptions, SummaryResult } from '../types';

describe('Summary types', () => {
  it('RouteSummary has expected shape', () => {
    const summary: RouteSummary = {
      totalRoutes: 10,
      addedRoutes: 2,
      removedRoutes: 1,
      modifiedRoutes: 3,
      unchangedRoutes: 4,
      breakingChanges: 1,
      byMethod: { GET: 5, POST: 5 },
      byFramework: { nextjs: 7, express: 3 },
    };
    expect(summary.totalRoutes).toBe(10);
    expect(summary.byMethod['GET']).toBe(5);
  });

  it('SummaryOptions all fields are optional', () => {
    const opts: SummaryOptions = {};
    expect(opts.includeUnchanged).toBeUndefined();
    expect(opts.groupByMethod).toBeUndefined();
    expect(opts.groupByFramework).toBeUndefined();
  });

  it('SummaryResult has fromRef, toRef, generatedAt and summary', () => {
    const result: SummaryResult = {
      summary: {
        totalRoutes: 0,
        addedRoutes: 0,
        removedRoutes: 0,
        modifiedRoutes: 0,
        unchangedRoutes: 0,
        breakingChanges: 0,
        byMethod: {},
        byFramework: {},
      },
      fromRef: 'HEAD~1',
      toRef: 'HEAD',
      generatedAt: new Date().toISOString(),
    };
    expect(result.fromRef).toBe('HEAD~1');
    expect(result.toRef).toBe('HEAD');
  });
});
