import { drainChanges, formatDrainText } from '../drainer';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, type: RouteChange['type'] = 'removed', extra: Partial<RouteChange> = {}): RouteChange {
  return { path, method: 'GET', type, ...extra } as RouteChange;
}

describe('drainChanges', () => {
  it('returns all changes as remaining when no options given', () => {
    const changes = [makeChange('/a'), makeChange('/b')];
    const result = drainChanges(changes, {});
    expect(result.drained).toHaveLength(0);
    expect(result.remaining).toHaveLength(2);
  });

  it('drains changes matching predicate', () => {
    const changes = [makeChange('/a', 'removed'), makeChange('/b', 'added')];
    const result = drainChanges(changes, { predicate: (c) => c.type === 'removed' });
    expect(result.drained).toHaveLength(1);
    expect(result.drained[0].path).toBe('/a');
    expect(result.remaining).toHaveLength(1);
    expect(result.remaining[0].path).toBe('/b');
  });

  it('drains changes older than maxAge', () => {
    const old = { ...makeChange('/old'), timestamp: Date.now() - 10000 } as any;
    const fresh = { ...makeChange('/fresh'), timestamp: Date.now() } as any;
    const result = drainChanges([old, fresh], { maxAge: 5000 });
    expect(result.drained).toHaveLength(1);
    expect(result.drained[0].path).toBe('/old');
    expect(result.remaining[0].path).toBe('/fresh');
  });

  it('respects maxCount cap on drained items', () => {
    const changes = [
      makeChange('/a', 'removed'),
      makeChange('/b', 'removed'),
      makeChange('/c', 'removed'),
    ];
    const result = drainChanges(changes, {
      predicate: () => true,
      maxCount: 2,
    });
    expect(result.drained).toHaveLength(2);
    expect(result.remaining).toHaveLength(1);
  });

  it('returns correct counts', () => {
    const changes = [makeChange('/x', 'added'), makeChange('/y', 'removed')];
    const result = drainChanges(changes, { predicate: (c) => c.type === 'added' });
    expect(result.drainedCount).toBe(1);
    expect(result.remainingCount).toBe(1);
  });
});

describe('formatDrainText', () => {
  it('formats drain result as text', () => {
    const changes = [makeChange('/api/users', 'removed')];
    const result = drainChanges(changes, { predicate: () => true });
    const text = formatDrainText(result);
    expect(text).toContain('Drain summary');
    expect(text).toContain('Drained : 1');
    expect(text).toContain('Remaining: 0');
    expect(text).toContain('/api/users');
  });

  it('shows zero drained when nothing removed', () => {
    const result = drainChanges([makeChange('/keep')], {});
    const text = formatDrainText(result);
    expect(text).toContain('Drained : 0');
    expect(text).toContain('Remaining: 1');
  });
});
