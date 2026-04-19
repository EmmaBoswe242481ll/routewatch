import { clampChanges, formatClampText } from '../clamper';
import { RouteChange } from '../../diff/types';

function makeChange(type: 'added' | 'removed' | 'modified', path: string): RouteChange {
  return {
    type,
    method: 'GET',
    path,
    ...(type === 'modified' ? { paramChanges: [] } : {}),
  } as RouteChange;
}

describe('clampChanges', () => {
  const changes = [
    makeChange('added', '/a'),
    makeChange('added', '/b'),
    makeChange('removed', '/c'),
    makeChange('modified', '/d'),
    makeChange('modified', '/e'),
  ];

  it('returns all changes when no limits set', () => {
    const result = clampChanges(changes, {});
    expect(result.changes).toHaveLength(5);
    expect(result.clamped).toBe(false);
  });

  it('clamps added changes', () => {
    const result = clampChanges(changes, { maxAdded: 1 });
    const added = result.changes.filter(c => c.type === 'added');
    expect(added).toHaveLength(1);
    expect(result.clamped).toBe(true);
  });

  it('clamps removed changes', () => {
    const result = clampChanges(changes, { maxRemoved: 0 });
    const removed = result.changes.filter(c => c.type === 'removed');
    expect(removed).toHaveLength(0);
    expect(result.clamped).toBe(true);
  });

  it('clamps modified changes', () => {
    const result = clampChanges(changes, { maxModified: 1 });
    const modified = result.changes.filter(c => c.type === 'modified');
    expect(modified).toHaveLength(1);
  });

  it('clamps total changes', () => {
    const result = clampChanges(changes, { maxTotal: 2 });
    expect(result.changes).toHaveLength(2);
    expect(result.clampedCount).toBe(2);
    expect(result.originalCount).toBe(5);
  });
});

describe('formatClampText', () => {
  it('reports no clamping', () => {
    const result = clampChanges([makeChange('added', '/x')], {});
    expect(formatClampText(result)).toContain('retained');
  });

  it('reports dropped count when clamped', () => {
    const changes = [makeChange('added', '/a'), makeChange('added', '/b')];
    const result = clampChanges(changes, { maxTotal: 1 });
    const text = formatClampText(result);
    expect(text).toContain('dropped 1');
  });
});
