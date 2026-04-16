import { resolveOwner, resolveOwnership, formatOwnershipText, OwnerRule } from '../resolver';
import { RouteChange } from '../../diff/types';

function makeChange(route: string, method = 'GET'): RouteChange {
  return { route, method, type: 'added', params: [] };
}

const rules: OwnerRule[] = [
  { pattern: '/api/users*', owner: 'alice', team: 'platform' },
  { pattern: '/api/orders*', owner: 'bob' },
];

describe('resolveOwner', () => {
  it('matches a wildcard pattern', () => {
    const result = resolveOwner('/api/users/123', rules);
    expect(result?.owner).toBe('alice');
    expect(result?.team).toBe('platform');
  });

  it('returns undefined when no pattern matches', () => {
    const result = resolveOwner('/api/products', rules);
    expect(result).toBeUndefined();
  });

  it('matches exact prefix wildcard', () => {
    const result = resolveOwner('/api/orders/456', rules);
    expect(result?.owner).toBe('bob');
  });
});

describe('resolveOwnership', () => {
  it('partitions changes into matched and unmatched', () => {
    const changes = [
      makeChange('/api/users'),
      makeChange('/api/orders/1'),
      makeChange('/api/products'),
    ];
    const result = resolveOwnership(changes, rules);
    expect(result.matched).toHaveLength(2);
    expect(result.unmatched).toHaveLength(1);
    expect(result.unmatched[0].route).toBe('/api/products');
  });

  it('returns all unmatched when rules are empty', () => {
    const changes = [makeChange('/api/users')];
    const result = resolveOwnership(changes, []);
    expect(result.matched).toHaveLength(0);
    expect(result.unmatched).toHaveLength(1);
  });

  it('returns empty result for no changes', () => {
    const result = resolveOwnership([], rules);
    expect(result.matched).toHaveLength(0);
    expect(result.unmatched).toHaveLength(0);
  });
});

describe('formatOwnershipText', () => {
  it('formats matched and unmatched routes', () => {
    const result = resolveOwnership([makeChange('/api/users'), makeChange('/api/other')], rules);
    const text = formatOwnershipText(result);
    expect(text).toContain('alice');
    expect(text).toContain('platform');
    expect(text).toContain('/api/other');
    expect(text).toContain('Unowned Routes');
  });

  it('shows no changes message for empty result', () => {
    const text = formatOwnershipText({ matched: [], unmatched: [] });
    expect(text).toContain('No changes to report.');
  });
});
