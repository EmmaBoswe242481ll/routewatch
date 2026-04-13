import { compareRoutes, routeKey } from '../compare';
import { Route } from '../../parsers/types';
import { ChangeType } from '../types';

const makeRoute = (path: string, method = 'GET', params: string[] = []): Route => ({
  path,
  method,
  params,
  file: `pages${path}.ts`,
  framework: 'nextjs',
});

describe('routeKey', () => {
  it('formats method and path', () => {
    expect(routeKey(makeRoute('/users', 'get'))).toBe('GET:/users');
  });

  it('defaults to ANY when method is missing', () => {
    const route: Route = { path: '/health', file: 'health.ts', framework: 'nextjs' };
    expect(routeKey(route)).toBe('ANY:/health');
  });
});

describe('compareRoutes', () => {
  it('detects added routes', () => {
    const before = [makeRoute('/users')];
    const after = [makeRoute('/users'), makeRoute('/posts')];
    const diff = compareRoutes(before, after);
    expect(diff.added).toBe(1);
    expect(diff.removed).toBe(0);
    expect(diff.modified).toBe(0);
    expect(diff.changes[0].type).toBe(ChangeType.Added);
    expect(diff.changes[0].route.path).toBe('/posts');
  });

  it('detects removed routes', () => {
    const before = [makeRoute('/users'), makeRoute('/posts')];
    const after = [makeRoute('/users')];
    const diff = compareRoutes(before, after);
    expect(diff.removed).toBe(1);
    expect(diff.changes[0].type).toBe(ChangeType.Removed);
    expect(diff.changes[0].route.path).toBe('/posts');
  });

  it('detects modified routes with param changes', () => {
    const before = [makeRoute('/users/[id]', 'GET', ['id'])];
    const after = [makeRoute('/users/[id]', 'GET', ['id', 'expand'])];
    // Keys differ — treat as removed+added unless paths match
    // Adjust: use same path so keys match
    const bRoute: Route = { path: '/users/[id]', method: 'GET', params: ['id'], file: 'f.ts', framework: 'nextjs' };
    const aRoute: Route = { path: '/users/[id]', method: 'GET', params: ['id', 'expand'], file: 'f.ts', framework: 'nextjs' };
    const diff = compareRoutes([bRoute], [aRoute]);
    expect(diff.modified).toBe(1);
    expect(diff.changes[0].type).toBe(ChangeType.Modified);
    expect(diff.changes[0].notes).toContain('Added params: expand');
  });

  it('returns empty diff for identical routes', () => {
    const routes = [makeRoute('/users'), makeRoute('/posts')];
    const diff = compareRoutes(routes, [...routes]);
    expect(diff.added).toBe(0);
    expect(diff.removed).toBe(0);
    expect(diff.modified).toBe(0);
    expect(diff.changes).toHaveLength(0);
  });

  it('handles empty before and after', () => {
    const diff = compareRoutes([], []);
    expect(diff.added).toBe(0);
    expect(diff.removed).toBe(0);
    expect(diff.changes).toHaveLength(0);
  });
});
