import {
  normalizePath,
  normalizeMethod,
  normalizeChange,
  normalizeChanges,
  formatNormalizationText,
} from '../normalizer';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, method: string, type: RouteChange['type'] = 'added'): RouteChange {
  return {
    type,
    route: { path, method, params: [], file: 'test.ts', framework: 'express' },
  };
}

describe('normalizePath', () => {
  it('lowercases paths by default', () => {
    expect(normalizePath('/Users/Profile')).toBe('/users/profile');
  });

  it('strips trailing slash by default', () => {
    expect(normalizePath('/api/users/')).toBe('/api/users');
  });

  it('preserves root slash', () => {
    expect(normalizePath('/')).toBe('/');
  });

  it('collapses params when option is set', () => {
    expect(normalizePath('/api/:userId/posts/:postId', { collapseParams: true })).toBe(
      '/api/:param/posts/:param'
    );
  });

  it('collapses Next.js dynamic segments when collapseParams is set', () => {
    expect(normalizePath('/api/[userId]/posts', { collapseParams: true })).toBe(
      '/api/[param]/posts'
    );
  });

  it('respects lowercasePaths: false', () => {
    expect(normalizePath('/API/Users', { lowercasePaths: false })).toBe('/API/Users');
  });
});

describe('normalizeMethod', () => {
  it('uppercases method', () => {
    expect(normalizeMethod('get')).toBe('GET');
  });

  it('trims whitespace', () => {
    expect(normalizeMethod('  post  ')).toBe('POST');
  });
});

describe('normalizeChange', () => {
  it('normalizes route path and method', () => {
    const change = makeChange('/API/Users/', 'get');
    const result = normalizeChange(change);
    expect(result.route.path).toBe('/api/users');
    expect(result.route.method).toBe('GET');
  });

  it('normalizes previousRoute when present', () => {
    const change: RouteChange = {
      type: 'modified',
      route: { path: '/API/Users/', method: 'get', params: [], file: 'test.ts', framework: 'express' },
      previousRoute: { path: '/API/User/', method: 'get', params: [], file: 'test.ts', framework: 'express' },
    };
    const result = normalizeChange(change);
    expect(result.previousRoute?.path).toBe('/api/user');
  });
});

describe('normalizeChanges', () => {
  it('normalizes an array of changes', () => {
    const changes = [makeChange('/API/A/', 'post'), makeChange('/API/B/', 'delete')];
    const results = normalizeChanges(changes);
    expect(results[0].route.path).toBe('/api/a');
    expect(results[1].route.method).toBe('DELETE');
  });
});

describe('formatNormalizationText', () => {
  it('reports normalized routes', () => {
    const original = [makeChange('/API/Users/', 'get')];
    const normalized = [makeChange('/api/users', 'GET')];
    const text = formatNormalizationText(original, normalized);
    expect(text).toContain('Normalization Summary');
    expect(text).toContain('Routes normalized: 1');
    expect(text).toContain('GET /API/Users/ -> GET /api/users');
  });

  it('reports zero when nothing changed', () => {
    const changes = [makeChange('/api/users', 'GET')];
    const text = formatNormalizationText(changes, changes);
    expect(text).toContain('Routes normalized: 0');
  });
});
