import { projectChange, projectChanges, formatProjectionText } from '../projector';
import { RouteChange } from '../../diff/types';

function makeChange(overrides: Partial<RouteChange> = {}): RouteChange {
  return {
    type: 'added',
    method: 'GET',
    path: '/api/users',
    params: [],
    file: 'pages/api/users.ts',
    ...overrides,
  } as RouteChange;
}

describe('projectChange', () => {
  it('projects selected fields', () => {
    const result = projectChange(makeChange(), { fields: [{ field: 'path' }, { field: 'method' }] });
    expect(result).toEqual({ path: '/api/users', method: 'GET' });
  });

  it('applies alias', () => {
    const result = projectChange(makeChange(), { fields: [{ field: 'path', alias: 'route' }] });
    expect(result).toHaveProperty('route', '/api/users');
    expect(result).not.toHaveProperty('path');
  });

  it('omits null fields by default', () => {
    const change = makeChange({ file: undefined } as Partial<RouteChange>);
    const result = projectChange(change, { fields: [{ field: 'file' }] });
    expect(result).not.toHaveProperty('file');
  });

  it('includes null fields when configured', () => {
    const change = makeChange({ file: undefined } as Partial<RouteChange>);
    const result = projectChange(change, { fields: [{ field: 'file' }], includeNulls: true });
    expect(result).toHaveProperty('file', null);
  });
});

describe('projectChanges', () => {
  it('maps over all changes', () => {
    const changes = [makeChange(), makeChange({ path: '/api/posts', method: 'POST' })];
    const results = projectChanges(changes, { fields: [{ field: 'path' }] });
    expect(results).toHaveLength(2);
    expect(results[1]).toEqual({ path: '/api/posts' });
  });
});

describe('formatProjectionText', () => {
  it('formats as tab-separated text', () => {
    const projected = [{ path: '/api/users', method: 'GET' }];
    const config = { fields: [{ field: 'path' as const }, { field: 'method' as const }] };
    const text = formatProjectionText(projected, config);
    expect(text).toContain('path\tmethod');
    expect(text).toContain('/api/users\tGET');
  });

  it('uses alias in header', () => {
    const projected = [{ route: '/api/users' }];
    const config = { fields: [{ field: 'path' as const, alias: 'route' }] };
    const text = formatProjectionText(projected, config);
    expect(text).toContain('route');
  });
});
