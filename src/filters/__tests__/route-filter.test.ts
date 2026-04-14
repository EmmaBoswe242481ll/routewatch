import { filterRoutes } from '../route-filter';
import type { ParsedRoute } from '../../parsers/types';
import type { FilterSet } from '../types';

const makeRoute = (path: string, methods: string[]): ParsedRoute => ({
  path,
  methods,
  params: [],
  file: 'test.ts',
  framework: 'express',
});

const routes: ParsedRoute[] = [
  makeRoute('/api/users', ['GET', 'POST']),
  makeRoute('/api/users/:id', ['GET', 'PUT', 'DELETE']),
  makeRoute('/api/orders', ['GET']),
  makeRoute('/health', ['GET']),
];

describe('filterRoutes', () => {
  it('returns all routes when no filters are applied', () => {
    const result = filterRoutes(routes, {});
    expect(result.matched).toHaveLength(4);
    expect(result.excluded).toHaveLength(0);
  });

  it('includes only routes matching a pattern', () => {
    const filterSet: FilterSet = {
      routes: [{ operator: 'include', pattern: '/api/*' }],
    };
    const result = filterRoutes(routes, filterSet);
    expect(result.matched).toHaveLength(3);
    expect(result.matched.every(r => r.path.startsWith('/api/'))).toBe(true);
  });

  it('excludes routes matching a pattern', () => {
    const filterSet: FilterSet = {
      routes: [{ operator: 'exclude', pattern: '/health' }],
    };
    const result = filterRoutes(routes, filterSet);
    expect(result.matched).toHaveLength(3);
    expect(result.excluded[0].path).toBe('/health');
  });

  it('includes only routes with specific methods', () => {
    const filterSet: FilterSet = {
      methods: [{ operator: 'include', methods: ['DELETE'] }],
    };
    const result = filterRoutes(routes, filterSet);
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0].path).toBe('/api/users/:id');
  });

  it('excludes routes with specific methods', () => {
    const filterSet: FilterSet = {
      methods: [{ operator: 'exclude', methods: ['POST', 'PUT', 'DELETE'] }],
    };
    const result = filterRoutes(routes, filterSet);
    expect(result.matched).toHaveLength(2);
    expect(result.matched.map(r => r.path)).toContain('/api/orders');
    expect(result.matched.map(r => r.path)).toContain('/health');
  });

  it('supports regex patterns', () => {
    const filterSet: FilterSet = {
      routes: [{ operator: 'include', pattern: /^\/api\/users/ }],
    };
    const result = filterRoutes(routes, filterSet);
    expect(result.matched).toHaveLength(2);
  });

  it('combines route and method filters', () => {
    const filterSet: FilterSet = {
      routes: [{ operator: 'include', pattern: '/api/*' }],
      methods: [{ operator: 'include', methods: ['GET'] }],
    };
    const result = filterRoutes(routes, filterSet);
    expect(result.matched).toHaveLength(3);
  });
});
