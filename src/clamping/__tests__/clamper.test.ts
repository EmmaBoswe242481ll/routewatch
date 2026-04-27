import { clampChanges, formatClampText } from '../clamper';
import type { RouteChange } from '../../diff/types';

function makeChange(path: string): RouteChange {
  return { type: 'added', path, method: 'GET', params: [] };
}

const BASE = [
  makeChange('/api/users'),
  makeChange('/api/orders'),
  makeChange('/api/products'),
  makeChange('/api/auth'),
  makeChange('/api/health'),
];

describe('clampChanges', () => {
  it('returns all changes when no options provided', () => {
    const result = clampChanges(BASE);
    expect(result.changes).toHaveLength(5);
    expect(result.clamped).toBe(0);
  });

  it('slices to [0, max]', () => {
    const result = clampChanges(BASE, { max: 3 });
    expect(result.changes).toHaveLength(3);
    expect(result.clamped).toBe(2);
  });

  it('slices to [min, end]', () => {
    const result = clampChanges(BASE, { min: 2 });
    expect(result.changes).toHaveLength(3);
    expect(result.clamped).toBe(2);
  });

  it('slices to [min, max]', () => {
    const result = clampChanges(BASE, { min: 1, max: 4 });
    expect(result.changes).toHaveLength(3);
  });

  it('returns empty array when min >= max', () => {
    const result = clampChanges(BASE, { min: 4, max: 2 });
    expect(result.changes).toHaveLength(0);
    expect(result.clamped).toBe(5);
  });

  it('sorts changes by path before clamping', () => {
    const result = clampChanges(BASE, { max: 2 });
    const paths = result.changes.map((c) => c.path);
    expect(paths).toEqual([...paths].sort());
  });
});

describe('formatClampText', () => {
  it('includes summary fields', () => {
    const result = clampChanges(BASE, { min: 1, max: 3 });
    const text = formatClampText(result);
    expect(text).toContain('Clamp Result');
    expect(text).toContain('Original');
    expect(text).toContain('Kept');
    expect(text).toContain('Clamped');
    expect(text).toContain('Range');
  });
});
