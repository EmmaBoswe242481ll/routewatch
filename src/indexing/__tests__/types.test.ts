import { buildIndexStats } from '../types';

describe('buildIndexStats', () => {
  it('computes counts from maps', () => {
    const byPath = new Map([['a', [1, 2]], ['b', [3]]]);
    const byMethod = new Map([['get', [1]]]);
    const byType = new Map([['added', [1, 2, 3]]]);

    const stats = buildIndexStats(
      byPath as Map<string, unknown[]>,
      byMethod as Map<string, unknown[]>,
      byType as Map<string, unknown[]>
    );

    expect(stats.totalPaths).toBe(2);
    expect(stats.totalMethods).toBe(1);
    expect(stats.totalTypes).toBe(1);
    expect(stats.pathCounts).toEqual({ a: 2, b: 1 });
    expect(stats.methodCounts).toEqual({ get: 1 });
    expect(stats.typeCounts).toEqual({ added: 3 });
  });

  it('handles empty maps', () => {
    const stats = buildIndexStats(
      new Map(),
      new Map(),
      new Map()
    );
    expect(stats.totalPaths).toBe(0);
    expect(stats.pathCounts).toEqual({});
  });
});
