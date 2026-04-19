import { foldChanges, formatFoldText } from '../folder';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, method = 'GET', type: RouteChange['type'] = 'added'): RouteChange {
  return {
    type,
    route: { path, method, params: [], framework: 'nextjs', filePath: '' },
  } as RouteChange;
}

describe('foldChanges', () => {
  it('does not fold paths within maxDepth', () => {
    const changes = [makeChange('/api/users')];
    const result = foldChanges(changes, { maxDepth: 3 });
    expect(result.foldedCount).toBe(0);
    expect(result.folded[0].route.path).toBe('/api/users');
  });

  it('folds paths exceeding maxDepth', () => {
    const changes = [makeChange('/api/users/123/profile')];
    const result = foldChanges(changes, { maxDepth: 2 });
    expect(result.foldedCount).toBe(1);
    expect(result.folded[0].route.path).toBe('/api/users/...');
  });

  it('preserves shallow and folds deep paths', () => {
    const changes = [
      makeChange('/api/users'),
      makeChange('/api/users/123/settings/notifications'),
    ];
    const result = foldChanges(changes, { maxDepth: 2 });
    expect(result.foldedCount).toBe(1);
    expect(result.folded[0].route.path).toBe('/api/users');
    expect(result.folded[1].route.path).toBe('/api/users/...');
  });

  it('returns original changes unchanged', () => {
    const changes = [makeChange('/a/b/c/d')];
    const result = foldChanges(changes, { maxDepth: 2 });
    expect(result.original[0].route.path).toBe('/a/b/c/d');
  });

  it('handles empty changes', () => {
    const result = foldChanges([], { maxDepth: 2 });
    expect(result.folded).toHaveLength(0);
    expect(result.foldedCount).toBe(0);
  });
});

describe('formatFoldText', () => {
  it('includes summary line and change entries', () => {
    const changes = [makeChange('/api/users/123/profile')];
    const result = foldChanges(changes, { maxDepth: 2 });
    const text = formatFoldText(result);
    expect(text).toContain('Folded 1 of 1 changes');
    expect(text).toContain('[added] GET /api/users/...');
  });
});
