import { matchesScope, scopeChanges, unscopedChanges, formatScopeText } from '../scoper';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, method = 'GET', type: RouteChange['type'] = 'added'): RouteChange {
  return { path, method, type, params: [] };
}

const rules = [
  { name: 'users', prefixes: ['/users'] },
  { name: 'admin', prefixes: ['/admin'], methods: ['POST', 'DELETE'] },
];

describe('matchesScope', () => {
  it('matches by prefix', () => {
    expect(matchesScope(makeChange('/users/123'), rules[0])).toBe(true);
  });

  it('does not match different prefix', () => {
    expect(matchesScope(makeChange('/orders/1'), rules[0])).toBe(false);
  });

  it('matches prefix and method', () => {
    expect(matchesScope(makeChange('/admin/action', 'POST'), rules[1])).toBe(true);
  });

  it('rejects wrong method even if prefix matches', () => {
    expect(matchesScope(makeChange('/admin/action', 'GET'), rules[1])).toBe(false);
  });
});

describe('scopeChanges', () => {
  const changes = [
    makeChange('/users/1'),
    makeChange('/admin/x', 'DELETE'),
    makeChange('/products/1'),
  ];

  it('groups changes by scope', () => {
    const results = scopeChanges(changes, rules);
    expect(results).toHaveLength(2);
    expect(results[0].scope).toBe('users');
    expect(results[0].changes).toHaveLength(1);
    expect(results[1].scope).toBe('admin');
    expect(results[1].changes).toHaveLength(1);
  });
});

describe('unscopedChanges', () => {
  const changes = [
    makeChange('/users/1'),
    makeChange('/products/2'),
  ];

  it('returns changes not matched by any rule', () => {
    const result = unscopedChanges(changes, rules);
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('/products/2');
  });
});

describe('formatScopeText', () => {
  it('formats results as text', () => {
    const results = [{ scope: 'users', changes: [makeChange('/users/1')] }];
    const text = formatScopeText(results);
    expect(text).toContain('Scope Results:');
    expect(text).toContain('[users]');
    expect(text).toContain('/users/1');
  });
});
