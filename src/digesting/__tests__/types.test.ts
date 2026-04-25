import { buildDigestSummary } from '../types';
import type { DigestedChange } from '../types';
import type { RouteChange } from '../../diff/types';

function makeDigested(digest: string): DigestedChange {
  return {
    original: {
      type: 'added',
      route: { path: '/test', method: 'GET', params: [] },
    } as RouteChange,
    digest,
    algorithm: 'sha256',
    fields: ['path', 'method'],
  };
}

describe('buildDigestSummary', () => {
  it('returns zeros for empty array', () => {
    const summary = buildDigestSummary([]);
    expect(summary.total).toBe(0);
    expect(summary.unique).toBe(0);
    expect(summary.collisions).toBe(0);
  });

  it('counts unique digests correctly', () => {
    const items = [makeDigested('abc'), makeDigested('abc'), makeDigested('def')];
    const summary = buildDigestSummary(items);
    expect(summary.total).toBe(3);
    expect(summary.unique).toBe(2);
    expect(summary.collisions).toBe(1);
  });

  it('reflects algorithm and fields from first item', () => {
    const items = [makeDigested('xyz')];
    const summary = buildDigestSummary(items);
    expect(summary.algorithm).toBe('sha256');
    expect(summary.fields).toEqual(['path', 'method']);
  });

  it('reports no collisions when all digests are unique', () => {
    const items = [makeDigested('a1'), makeDigested('b2'), makeDigested('c3')];
    const summary = buildDigestSummary(items);
    expect(summary.collisions).toBe(0);
    expect(summary.unique).toBe(3);
  });
});
