import { buildClampResult } from '../types';
import type { RouteChange } from '../../diff/types';

function makeChange(path: string): RouteChange {
  return { type: 'added', path, method: 'GET', params: [] };
}

describe('buildClampResult', () => {
  it('records original count and clamped delta', () => {
    const changes = [makeChange('/a'), makeChange('/b')];
    const result = buildClampResult(changes, 5, { min: 1, max: 3 });
    expect(result.original).toBe(5);
    expect(result.changes).toHaveLength(2);
    expect(result.clamped).toBe(3); // 5 - 2
    expect(result.min).toBe(1);
    expect(result.max).toBe(3);
  });

  it('handles undefined min/max', () => {
    const changes = [makeChange('/x')];
    const result = buildClampResult(changes, 1, {});
    expect(result.min).toBeUndefined();
    expect(result.max).toBeUndefined();
  });
});
