import { highlightChange, highlightChanges, formatHighlightText, HighlightRule } from '../highlighter';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, method = 'GET', type: RouteChange['type'] = 'added'): RouteChange {
  return { type, route: { path, method, params: [] }, diff: [] } as unknown as RouteChange;
}

const rules: HighlightRule[] = [
  { field: 'path', pattern: '^/api', color: 'blue', label: 'api' },
  { field: 'method', pattern: 'DELETE', color: 'red' },
  { field: 'changeType', pattern: 'removed', color: 'orange' },
];

describe('highlightChange', () => {
  it('matches path rule', () => {
    const result = highlightChange(makeChange('/api/users'), rules);
    expect(result.highlights).toHaveLength(1);
    expect(result.highlights[0].color).toBe('blue');
    expect(result.highlights[0].label).toBe('api');
  });

  it('matches method rule', () => {
    const result = highlightChange(makeChange('/items', 'DELETE'), rules);
    expect(result.highlights.some((h) => h.color === 'red')).toBe(true);
  });

  it('matches changeType rule', () => {
    const result = highlightChange(makeChange('/foo', 'GET', 'removed'), rules);
    expect(result.highlights.some((h) => h.color === 'orange')).toBe(true);
  });

  it('returns no highlights when no rules match', () => {
    const result = highlightChange(makeChange('/health', 'GET', 'added'), rules);
    expect(result.highlights).toHaveLength(0);
  });

  it('can match multiple rules', () => {
    const result = highlightChange(makeChange('/api/items', 'DELETE', 'added'), rules);
    expect(result.highlights).toHaveLength(2);
  });
});

describe('highlightChanges', () => {
  it('processes all changes', () => {
    const changes = [makeChange('/api/a'), makeChange('/b', 'DELETE')];
    const results = highlightChanges(changes, rules);
    expect(results).toHaveLength(2);
  });
});

describe('formatHighlightText', () => {
  it('returns fallback for empty results', () => {
    expect(formatHighlightText([])).toBe('No highlighted changes.');
  });

  it('formats results with highlights', () => {
    const results = highlightChanges([makeChange('/api/users')], rules);
    const text = formatHighlightText(results);
    expect(text).toContain('ADDED');
    expect(text).toContain('/api/users');
    expect(text).toContain('[blue:api]');
  });

  it('shows [none] when no highlights', () => {
    const results = highlightChanges([makeChange('/health')], rules);
    expect(formatHighlightText(results)).toContain('[none]');
  });
});
