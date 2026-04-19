import { buildIndex, lookupByPath, lookupByMethod, formatIndexText } from '../indexer';
import type { RouteChange } from '../../diff/types';

function makeChange(
  path: string,
  method: string,
  type: RouteChange['type'] = 'added'
): RouteChange {
  return {
    type,
    route: { path, method, params: [] },
  } as unknown as RouteChange;
}

describe('buildIndex', () => {
  it('indexes changes by path', () => {
    const changes = [makeChange('/users', 'GET'), makeChange('/users', 'POST')];
    const index = buildIndex(changes);
    expect(index.byPath.get('/users')).toHaveLength(2);
  });

  it('indexes changes by method', () => {
    const changes = [makeChange('/a', 'GET'), makeChange('/b', 'GET'), makeChange('/c', 'POST')];
    const index = buildIndex(changes);
    expect(index.byMethod.get('get')).toHaveLength(2);
    expect(index.byMethod.get('post')).toHaveLength(1);
  });

  it('indexes changes by type', () => {
    const changes = [makeChange('/a', 'GET', 'added'), makeChange('/b', 'DELETE', 'removed')];
    const index = buildIndex(changes);
    expect(index.byType.get('added')).toHaveLength(1);
    expect(index.byType.get('removed')).toHaveLength(1);
  });

  it('respects caseSensitive option', () => {
    const changes = [makeChange('/Users', 'GET')];
    const index = buildIndex(changes, { caseSensitive: true });
    expect(index.byPath.get('/Users')).toHaveLength(1);
    expect(index.byPath.get('/users')).toBeUndefined();
  });
});

describe('lookupByPath', () => {
  it('returns changes for a given path', () => {
    const changes = [makeChange('/items', 'GET')];
    const index = buildIndex(changes);
    expect(lookupByPath(index, '/items')).toHaveLength(1);
  });

  it('returns empty array for unknown path', () => {
    const index = buildIndex([]);
    expect(lookupByPath(index, '/nope')).toEqual([]);
  });
});

describe('lookupByMethod', () => {
  it('returns changes for a given method', () => {
    const changes = [makeChange('/a', 'PATCH')];
    const index = buildIndex(changes);
    expect(lookupByMethod(index, 'PATCH')).toHaveLength(1);
  });
});

describe('formatIndexText', () => {
  it('returns a summary string', () => {
    const changes = [makeChange('/x', 'GET', 'added')];
    const index = buildIndex(changes);
    const text = formatIndexText(index);
    expect(text).toContain('Route Index Summary');
    expect(text).toContain('1');
  });
});
