import { graftChange, graftChanges, formatGraftText } from '../grafter';
import type { RouteChange } from '../../diff/types';
import type { GraftRule } from '../types';

function makeChange(path: string, method = 'GET'): RouteChange {
  return { path, method, type: 'modified', before: null, after: null } as any;
}

describe('graftChange', () => {
  it('returns null when no rule matches', () => {
    const rules: GraftRule[] = [{ sourcePattern: '/api/v1/*', targetPattern: '/api/v2/*' }];
    expect(graftChange(makeChange('/other/route'), rules)).toBeNull();
  });

  it('matches wildcard pattern and applies target', () => {
    const rules: GraftRule[] = [{ sourcePattern: '/api/v1/*', targetPattern: '/api/v2/*' }];
    const result = graftChange(makeChange('/api/v1/users'), rules);
    expect(result).not.toBeNull();
    expect(result!.original).toBe('/api/v1/users');
    expect(result!.ruleIndex).toBe(0);
  });

  it('respects method filter', () => {
    const rules: GraftRule[] = [{ sourcePattern: '/api/*', targetPattern: '/v2/*', method: 'POST' }];
    expect(graftChange(makeChange('/api/foo', 'GET'), rules)).toBeNull();
    expect(graftChange(makeChange('/api/foo', 'POST'), rules)).not.toBeNull();
  });

  it('applies custom transform function', () => {
    const rules: GraftRule[] = [{
      sourcePattern: '/legacy/*',
      targetPattern: '',
      transform: (p) => p.replace('/legacy', '/modern'),
    }];
    const result = graftChange(makeChange('/legacy/orders'), rules);
    expect(result!.grafted).toBe('/modern/orders');
    expect(result!.transformed).toBe(true);
  });

  it('marks as not transformed when path unchanged', () => {
    const rules: GraftRule[] = [{ sourcePattern: '/same', targetPattern: '/same' }];
    const result = graftChange(makeChange('/same'), rules);
    expect(result!.transformed).toBe(false);
  });
});

describe('graftChanges', () => {
  const rules: GraftRule[] = [
    { sourcePattern: '/api/v1/*', targetPattern: '/api/v2/*' },
  ];

  it('counts ungrafted changes', () => {
    const changes = [makeChange('/api/v1/users'), makeChange('/health')];
    const result = graftChanges(changes, rules);
    expect(result.changes).toHaveLength(1);
    expect(result.ungrafted).toBe(1);
  });

  it('returns empty result for no changes', () => {
    const result = graftChanges([], rules);
    expect(result.changes).toHaveLength(0);
    expect(result.ungrafted).toBe(0);
    expect(result.totalRules).toBe(1);
  });
});

describe('formatGraftText', () => {
  it('returns message when nothing grafted', () => {
    const text = formatGraftText({ changes: [], ungrafted: 2, totalRules: 1 });
    expect(text).toBe('No changes were grafted.');
  });

  it('formats grafted changes', () => {
    const changes = [{ original: '/a', grafted: '/b', method: 'GET', ruleIndex: 0, transformed: true }];
    const text = formatGraftText({ changes, ungrafted: 0, totalRules: 1 });
    expect(text).toContain('[GET] /a -> /b');
    expect(text).toContain('Grafted 1 change(s)');
  });

  it('appends no-op label for untransformed changes', () => {
    const changes = [{ original: '/x', grafted: '/x', method: 'DELETE', ruleIndex: 0, transformed: false }];
    const text = formatGraftText({ changes, ungrafted: 0, totalRules: 1 });
    expect(text).toContain('(no-op)');
  });
});
