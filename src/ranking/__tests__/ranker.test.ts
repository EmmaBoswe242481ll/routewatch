import { rankChanges, scoreChange, formatRankText } from '../ranker';
import { RouteChange } from '../../diff/types';

function makeChange(overrides: Partial<RouteChange> = {}): RouteChange {
  return {
    type: 'modified',
    method: 'GET',
    path: '/api/test',
    breaking: false,
    paramChanges: [],
    ...overrides,
  };
}

describe('scoreChange', () => {
  it('scores removed routes higher than added', () => {
    const removed = scoreChange(makeChange({ type: 'removed' }));
    const added = scoreChange(makeChange({ type: 'added' }));
    expect(removed.score).toBeGreaterThan(added.score);
  });

  it('adds breaking change weight', () => {
    const normal = scoreChange(makeChange({ type: 'modified' }));
    const breaking = scoreChange(makeChange({ type: 'modified', breaking: true }));
    expect(breaking.score).toBeGreaterThan(normal.score);
  });

  it('includes reasons', () => {
    const { reasons } = scoreChange(makeChange({ type: 'removed', breaking: true }));
    expect(reasons).toContain('Route removed');
    expect(reasons).toContain('Breaking change detected');
  });

  it('scores param changes', () => {
    const noParams = scoreChange(makeChange());
    const withParams = scoreChange(makeChange({ paramChanges: [{ name: 'id', type: 'added' }] as any }));
    expect(withParams.score).toBeGreaterThan(noParams.score);
  });
});

describe('rankChanges', () => {
  it('ranks by score descending', () => {
    const changes = [
      makeChange({ type: 'added' }),
      makeChange({ type: 'removed' }),
      makeChange({ type: 'modified' }),
    ];
    const ranked = rankChanges(changes);
    expect(ranked[0].change.type).toBe('removed');
    expect(ranked[0].rank).toBe(1);
  });

  it('respects limit option', () => {
    const changes = [makeChange(), makeChange(), makeChange()];
    const ranked = rankChanges(changes, { limit: 2 });
    expect(ranked).toHaveLength(2);
  });

  it('returns empty array for no changes', () => {
    expect(rankChanges([])).toEqual([]);
  });
});

describe('formatRankText', () => {
  it('returns message when empty', () => {
    expect(formatRankText([])).toBe('No changes to rank.');
  });

  it('formats ranked changes', () => {
    const ranked = rankChanges([makeChange({ type: 'removed', path: '/api/users' })]);
    const text = formatRankText(ranked);
    expect(text).toContain('#1');
    expect(text).toContain('/api/users');
  });
});
