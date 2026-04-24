import { pruneChanges, formatPruneText } from '../pruner';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, method = 'GET', extra: Record<string, unknown> = {}): RouteChange {
  return { path, method, type: 'added', ...extra } as RouteChange;
}

describe('pruneChanges', () => {
  it('returns all changes when no config provided', () => {
    const changes = [makeChange('/a'), makeChange('/b')];
    const result = pruneChanges(changes);
    expect(result.kept).toHaveLength(2);
    expect(result.pruned).toHaveLength(0);
  });

  it('removes changes with empty methods', () => {
    const changes = [makeChange('/a', 'GET'), makeChange('/b', '')];
    const result = pruneChanges(changes, { removeEmptyMethods: true });
    expect(result.kept).toHaveLength(1);
    expect(result.pruned).toHaveLength(1);
    expect(result.pruned[0].path).toBe('/b');
    expect(result.reasons[':/ b'] ?? result.reasons[':']).toBeUndefined();
    expect(Object.values(result.reasons)).toContain('empty method');
  });

  it('removes duplicate path+method combinations', () => {
    const changes = [makeChange('/a', 'GET'), makeChange('/a', 'GET'), makeChange('/a', 'POST')];
    const result = pruneChanges(changes, { removeDuplicatePaths: true });
    expect(result.kept).toHaveLength(2);
    expect(result.pruned).toHaveLength(1);
    expect(Object.values(result.reasons)).toContain('duplicate path+method');
  });

  it('prunes changes exceeding maxCount', () => {
    const changes = [makeChange('/a'), makeChange('/b'), makeChange('/c')];
    const result = pruneChanges(changes, { maxCount: 2 });
    expect(result.kept).toHaveLength(2);
    expect(result.pruned).toHaveLength(1);
    expect(Object.values(result.reasons)).toContain('exceeded maxCount');
  });

  it('prunes changes older than maxAge', () => {
    const old = makeChange('/old', 'GET', { timestamp: Date.now() - 10000 });
    const fresh = makeChange('/new', 'GET', { timestamp: Date.now() });
    const result = pruneChanges([old, fresh], { maxAge: 5000 });
    expect(result.kept).toHaveLength(1);
    expect(result.kept[0].path).toBe('/new');
    expect(Object.values(result.reasons)).toContain('exceeded maxAge');
  });

  it('applies multiple prune rules in order', () => {
    const changes = [
      makeChange('/a', 'GET'),
      makeChange('/a', 'GET'),
      makeChange('/b', ''),
    ];
    const result = pruneChanges(changes, { removeEmptyMethods: true, removeDuplicatePaths: true });
    expect(result.kept).toHaveLength(1);
    expect(result.pruned).toHaveLength(2);
  });
});

describe('formatPruneText', () => {
  it('formats a summary with pruned entries', () => {
    const changes = [makeChange('/a', 'GET'), makeChange('/a', 'GET')];
    const result = pruneChanges(changes, { removeDuplicatePaths: true });
    const text = formatPruneText(result);
    expect(text).toContain('1 kept');
    expect(text).toContain('1 pruned');
    expect(text).toContain('duplicate path+method');
  });

  it('shows clean summary when nothing pruned', () => {
    const result = pruneChanges([makeChange('/a')], {});
    const text = formatPruneText(result);
    expect(text).toContain('1 kept');
    expect(text).toContain('0 pruned');
  });
});
