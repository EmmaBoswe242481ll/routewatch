import {
  mirrorChange,
  mirrorChanges,
  buildMirrorSummary,
  formatMirrorText,
  MirrorRule,
} from '../mirror';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, method = 'GET'): RouteChange {
  return { type: 'added', path, method, params: [] };
}

describe('mirrorChange', () => {
  const rules: MirrorRule[] = [
    { source: '/api/*', target: '/v2/$1' },
    { source: '/users/:id', target: '/members/:id' },
  ];

  it('returns null when no rule matches', () => {
    const result = mirrorChange(makeChange('/health'), rules);
    expect(result).toBeNull();
  });

  it('mirrors path using wildcard rule', () => {
    const result = mirrorChange(makeChange('/api/orders'), rules);
    expect(result).not.toBeNull();
    expect(result!.mirrored.path).toBe('/v2/orders');
    expect(result!.rule.source).toBe('/api/*');
  });

  it('preserves method on mirrored change', () => {
    const result = mirrorChange(makeChange('/api/items', 'POST'), rules);
    expect(result!.mirrored.method).toBe('POST');
  });

  it('preserves original change', () => {
    const change = makeChange('/api/products');
    const result = mirrorChange(change, rules);
    expect(result!.original).toBe(change);
  });
});

describe('mirrorChanges', () => {
  const rules: MirrorRule[] = [{ source: '/api/*', target: '/v2/$1' }];

  it('returns only matched changes', () => {
    const changes = [
      makeChange('/api/users'),
      makeChange('/health'),
      makeChange('/api/posts'),
    ];
    const results = mirrorChanges(changes, rules);
    expect(results).toHaveLength(2);
    expect(results[0].mirrored.path).toBe('/v2/users');
    expect(results[1].mirrored.path).toBe('/v2/posts');
  });

  it('returns empty array when no rules match', () => {
    expect(mirrorChanges([makeChange('/health')], rules)).toEqual([]);
  });
});

describe('buildMirrorSummary', () => {
  it('computes correct summary counts', () => {
    const changes = [makeChange('/api/a'), makeChange('/other')];
    const rules: MirrorRule[] = [{ source: '/api/*', target: '/v2/$1' }];
    const results = mirrorChanges(changes, rules);
    const summary = buildMirrorSummary(changes, results);
    expect(summary.total).toBe(2);
    expect(summary.mirrored).toBe(1);
    expect(summary.unmatched).toBe(1);
  });
});

describe('formatMirrorText', () => {
  it('returns fallback for empty results', () => {
    expect(formatMirrorText([])).toBe('No routes mirrored.');
  });

  it('formats results with arrow notation', () => {
    const rules: MirrorRule[] = [{ source: '/api/*', target: '/v2/$1' }];
    const results = mirrorChanges([makeChange('/api/users', 'GET')], rules);
    const text = formatMirrorText(results);
    expect(text).toContain('/api/users');
    expect(text).toContain('/v2/users');
    expect(text).toContain('GET');
    expect(text).toContain('Mirrored Routes (1)');
  });
});
