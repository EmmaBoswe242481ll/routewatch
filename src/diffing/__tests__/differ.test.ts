import { partitionChanges, buildDiffResult, formatDiffSummary } from '../differ';
import type { RouteChange } from '../../diff/types';

function makeChange(type: RouteChange['type'], path = '/api/test'): RouteChange {
  return { type, method: 'GET', path, before: null, after: null, paramChanges: [] } as unknown as RouteChange;
}

describe('partitionChanges', () => {
  it('separates added, removed, modified', () => {
    const changes = [
      makeChange('added', '/a'),
      makeChange('removed', '/b'),
      makeChange('modified', '/c'),
      makeChange('added', '/d'),
    ];
    const result = partitionChanges(changes);
    expect(result.added).toHaveLength(2);
    expect(result.removed).toHaveLength(1);
    expect(result.modified).toHaveLength(1);
  });

  it('returns empty arrays when no changes', () => {
    const result = partitionChanges([]);
    expect(result.added).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
    expect(result.modified).toHaveLength(0);
  });
});

describe('buildDiffResult', () => {
  const ctx = { fromRef: 'abc', toRef: 'def', timestamp: 1000 };

  it('computes unchanged count correctly', () => {
    const changes = [makeChange('removed', '/x'), makeChange('added', '/y')];
    const result = buildDiffResult(changes, ctx, 5);
    expect(result.unchanged).toBe(4);
    expect(result.added).toHaveLength(1);
    expect(result.removed).toHaveLength(1);
  });

  it('clamps unchanged to 0', () => {
    const changes = [makeChange('removed'), makeChange('removed')];
    const result = buildDiffResult(changes, ctx, 1);
    expect(result.unchanged).toBe(0);
  });
});

describe('formatDiffSummary', () => {
  it('includes ref names and counts', () => {
    const result = buildDiffResult(
      [makeChange('added'), makeChange('modified')],
      { fromRef: 'v1', toRef: 'v2', timestamp: 0 },
      10
    );
    const text = formatDiffSummary(result);
    expect(text).toContain('v1 → v2');
    expect(text).toContain('Added:    1');
    expect(text).toContain('Modified: 1');
    expect(text).toContain('Unchanged: 9');
  });
});
