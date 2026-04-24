import {
  getPathDepth,
  getPathSegments,
  isWildcardSegment,
  spanChange,
  spanChanges,
  buildSpanSummary,
  formatSpanText,
} from '../spanner';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, method = 'GET'): RouteChange {
  return { path, method, type: 'added', params: [] };
}

describe('getPathDepth', () => {
  it('returns 0 for root', () => expect(getPathDepth('/')).toBe(0));
  it('returns correct depth', () => expect(getPathDepth('/api/users/profile')).toBe(3));
  it('handles no leading slash', () => expect(getPathDepth('api/v1')).toBe(2));
});

describe('getPathSegments', () => {
  it('splits path into segments', () => {
    expect(getPathSegments('/api/users')).toEqual(['api', 'users']);
  });
  it('filters empty segments', () => {
    expect(getPathSegments('/')).toEqual([]);
  });
});

describe('isWildcardSegment', () => {
  it('detects colon params', () => expect(isWildcardSegment(':id')).toBe(true));
  it('detects star wildcard', () => expect(isWildcardSegment('*')).toBe(true));
  it('detects double star', () => expect(isWildcardSegment('**')).toBe(true));
  it('returns false for plain segment', () => expect(isWildcardSegment('users')).toBe(false));
});

describe('spanChange', () => {
  it('computes depth and segments', () => {
    const result = spanChange(makeChange('/api/users'));
    expect(result.depth).toBe(2);
    expect(result.segments).toEqual(['api', 'users']);
    expect(result.isWildcard).toBe(false);
  });

  it('marks wildcard routes', () => {
    const result = spanChange(makeChange('/api/users/:id'));
    expect(result.isWildcard).toBe(true);
  });

  it('respects includeWildcards=false', () => {
    const result = spanChange(makeChange('/api/:id'), { includeWildcards: false });
    expect(result.isWildcard).toBe(false);
  });
});

describe('spanChanges', () => {
  const changes = [
    makeChange('/a'),
    makeChange('/a/b'),
    makeChange('/a/b/c'),
    makeChange('/a/b/:id'),
  ];

  it('returns all results without filters', () => {
    expect(spanChanges(changes)).toHaveLength(4);
  });

  it('filters by minDepth', () => {
    const results = spanChanges(changes, { minDepth: 2 });
    expect(results.every(r => r.depth >= 2)).toBe(true);
  });

  it('filters by maxDepth', () => {
    const results = spanChanges(changes, { maxDepth: 2 });
    expect(results.every(r => r.depth <= 2)).toBe(true);
  });
});

describe('buildSpanSummary', () => {
  it('handles empty input', () => {
    const s = buildSpanSummary([]);
    expect(s.total).toBe(0);
    expect(s.avgDepth).toBe(0);
  });

  it('computes correct summary', () => {
    const results = spanChanges([makeChange('/a'), makeChange('/a/b/c')]);
    const s = buildSpanSummary(results);
    expect(s.total).toBe(2);
    expect(s.minDepth).toBe(1);
    expect(s.maxDepth).toBe(3);
    expect(s.avgDepth).toBe(2);
  });
});

describe('formatSpanText', () => {
  it('produces non-empty output', () => {
    const results = spanChanges([makeChange('/api/users'), makeChange('/api/:id')]);
    const text = formatSpanText(results);
    expect(text).toContain('Span Analysis');
    expect(text).toContain('[wildcard]');
  });
});
