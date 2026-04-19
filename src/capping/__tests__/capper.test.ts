import { capChanges, formatCapText } from '../capper';
import { RouteChange } from '../../diff/types';

function makeChange(type: 'added' | 'removed' | 'modified', path: string, method = 'GET'): RouteChange {
  return {
    type,
    route: { path, method, params: [] },
  } as RouteChange;
}

describe('capChanges', () => {
  it('returns all changes when under limits', () => {
    const changes = [makeChange('added', '/a'), makeChange('removed', '/b')];
    const result = capChanges(changes, { maxChanges: 10 });
    expect(result.capped).toBe(false);
    expect(result.totalAfter).toBe(2);
    expect(result.cappedBy).toBeNull();
  });

  it('caps by maxChanges', () => {
    const changes = [makeChange('added', '/a'), makeChange('added', '/b'), makeChange('removed', '/c')];
    const result = capChanges(changes, { maxChanges: 2 });
    expect(result.capped).toBe(true);
    expect(result.totalAfter).toBe(2);
    expect(result.cappedBy).toBe('maxChanges');
  });

  it('caps by maxAdded', () => {
    const changes = [makeChange('added', '/a'), makeChange('added', '/b'), makeChange('removed', '/c')];
    const result = capChanges(changes, { maxAdded: 1 });
    expect(result.capped).toBe(true);
    expect(result.changes.filter(c => c.type === 'added')).toHaveLength(1);
    expect(result.cappedBy).toBe('maxAdded');
  });

  it('caps by maxRemoved', () => {
    const changes = [makeChange('removed', '/a'), makeChange('removed', '/b'), makeChange('added', '/c')];
    const result = capChanges(changes, { maxRemoved: 1 });
    expect(result.changes.filter(c => c.type === 'removed')).toHaveLength(1);
    expect(result.cappedBy).toBe('maxRemoved');
  });

  it('caps by maxModified', () => {
    const changes = [makeChange('modified', '/a'), makeChange('modified', '/b')];
    const result = capChanges(changes, { maxModified: 1 });
    expect(result.changes.filter(c => c.type === 'modified')).toHaveLength(1);
    expect(result.cappedBy).toBe('maxModified');
  });

  it('reports first cap reason when multiple limits triggered', () => {
    const changes = [
      makeChange('added', '/a'), makeChange('added', '/b'),
      makeChange('removed', '/c'), makeChange('removed', '/d'),
    ];
    const result = capChanges(changes, { maxAdded: 1, maxRemoved: 1 });
    expect(result.cappedBy).toBe('maxAdded');
  });
});

describe('formatCapText', () => {
  it('returns no-op message when not capped', () => {
    const result = capChanges([makeChange('added', '/a')], { maxChanges: 5 });
    expect(formatCapText(result)).toContain('no changes removed');
  });

  it('returns cap summary when capped', () => {
    const changes = [makeChange('added', '/a'), makeChange('added', '/b'), makeChange('added', '/c')];
    const result = capChanges(changes, { maxChanges: 2 });
    expect(formatCapText(result)).toContain('maxChanges');
    expect(formatCapText(result)).toContain('3 →');
  });
});
