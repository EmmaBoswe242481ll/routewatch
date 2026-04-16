import {
  resolveRoutePath,
  resolveRoute,
  resolveRoutes,
  formatResolutionText,
} from '../resolver';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, method = 'GET'): RouteChange {
  return { path, method, type: 'added', before: null, after: { path, method, params: [] } };
}

describe('resolveRoutePath', () => {
  it('returns path unchanged with no options', () => {
    expect(resolveRoutePath('/api/users')).toBe('/api/users');
  });

  it('strips prefix', () => {
    expect(resolveRoutePath('/api/users', { stripPrefix: '/api' })).toBe('/users');
  });

  it('adds prefix', () => {
    expect(resolveRoutePath('/users', { addPrefix: '/v1' })).toBe('/v1/users');
  });

  it('prepends baseUrl', () => {
    expect(resolveRoutePath('/users', { baseUrl: 'https://example.com' })).toBe(
      'https://example.com/users'
    );
  });

  it('strips prefix and adds baseUrl', () => {
    expect(
      resolveRoutePath('/api/users', { stripPrefix: '/api', baseUrl: 'https://example.com' })
    ).toBe('https://example.com/users');
  });

  it('returns / when path equals stripped prefix', () => {
    expect(resolveRoutePath('/api', { stripPrefix: '/api' })).toBe('/');
  });
});

describe('resolveRoute', () => {
  it('resolves a simple route', () => {
    const result = resolveRoute(makeChange('/users'), { addPrefix: '/v2' });
    expect(result.resolved).toBe('/v2/users');
    expect(result.original).toBe('/users');
    expect(result.method).toBe('GET');
  });

  it('extracts express-style params', () => {
    const result = resolveRoute(makeChange('/users/:id'));
    expect(result.params).toHaveProperty('id');
  });

  it('extracts nextjs-style params', () => {
    const result = resolveRoute(makeChange('/users/[id]'));
    expect(result.params).toHaveProperty('id');
  });
});

describe('resolveRoutes', () => {
  it('maps all changes', () => {
    const changes = [makeChange('/a'), makeChange('/b')];
    const results = resolveRoutes(changes, { addPrefix: '/v1' });
    expect(results).toHaveLength(2);
    expect(results[0].resolved).toBe('/v1/a');
  });
});

describe('formatResolutionText', () => {
  it('returns message for empty list', () => {
    expect(formatResolutionText([])).toBe('No routes resolved.');
  });

  it('formats resolved routes', () => {
    const routes = [{ original: '/a', resolved: '/v1/a', params: {}, method: 'GET' }];
    const text = formatResolutionText(routes);
    expect(text).toContain('Resolved 1 route(s)');
    expect(text).toContain('[GET] /a -> /v1/a');
  });
});
