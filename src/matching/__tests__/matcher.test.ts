import {
  matchChange,
  matchChanges,
  filterMatched,
  filterUnmatched,
  formatMatchText,
} from '../matcher';
import { RouteChange } from '../../parsers/types';

function makeChange(path: string, method = 'GET'): RouteChange {
  return { path, method, type: 'added', params: [] };
}

describe('matchChange', () => {
  const rules = [
    { pattern: '/api/*', label: 'api' },
    { pattern: '/health', label: 'health' },
  ];

  it('matches wildcard pattern', () => {
    const result = matchChange(makeChange('/api/users'), rules);
    expect(result.matched).toBe(true);
    expect(result.label).toBe('api');
  });

  it('matches exact pattern', () => {
    const result = matchChange(makeChange('/health'), rules);
    expect(result.matched).toBe(true);
    expect(result.label).toBe('health');
  });

  it('returns unmatched for no rule hit', () => {
    const result = matchChange(makeChange('/unknown'), rules);
    expect(result.matched).toBe(false);
    expect(result.label).toBeUndefined();
  });
});

describe('matchChanges', () => {
  it('processes multiple changes', () => {
    const changes = [makeChange('/api/v1'), makeChange('/other')];
    const results = matchChanges(changes, [{ pattern: '/api/*' }]);
    expect(results).toHaveLength(2);
    expect(results[0].matched).toBe(true);
    expect(results[1].matched).toBe(false);
  });
});

describe('filterMatched / filterUnmatched', () => {
  it('splits results correctly', () => {
    const changes = [makeChange('/api/x'), makeChange('/other')];
    const results = matchChanges(changes, [{ pattern: '/api/*', label: 'api' }]);
    expect(filterMatched(results)).toHaveLength(1);
    expect(filterUnmatched(results)).toHaveLength(1);
  });
});

describe('formatMatchText', () => {
  it('returns message for empty results', () => {
    expect(formatMatchText([])).toBe('No match results.');
  });

  it('formats results with labels', () => {
    const results = matchChanges([makeChange('/api/users')], [{ pattern: '/api/*', label: 'api' }]);
    const text = formatMatchText(results);
    expect(text).toContain('[MATCH:api]');
    expect(text).toContain('/api/users');
  });

  it('formats unmatched results', () => {
    const results = matchChanges([makeChange('/other')], [{ pattern: '/api/*' }]);
    const text = formatMatchText(results);
    expect(text).toContain('[NO MATCH]');
  });
});
