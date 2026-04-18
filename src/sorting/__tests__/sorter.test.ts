import { sortChanges, formatSortText } from '../sorter';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, method: string, type: 'added' | 'modified' | 'removed'): RouteChange {
  return { type, route: { path, method, params: [] }, changes: [] } as any;
}

describe('sortChanges', () => {
  const changes = [
    makeChange('/users', 'GET', 'modified'),
    makeChange('/alpha', 'POST', 'added'),
    makeChange('/zebra', 'DELETE', 'removed'),
  ];

  it('sorts by path asc', () => {
    const result = sortChanges(changes, { field: 'path' });
    expect(result[0].route.path).toBe('/alpha');
    expect(result[1].route.path).toBe('/users');
    expect(result[2].route.path).toBe('/zebra');
  });

  it('sorts by path desc', () => {
    const result = sortChanges(changes, { field: 'path', order: 'desc' });
    expect(result[0].route.path).toBe('/zebra');
  });

  it('sorts by method asc', () => {
    const result = sortChanges(changes, { field: 'method' });
    expect(result[0].route.method).toBe('DELETE');
    expect(result[1].route.method).toBe('GET');
    expect(result[2].route.method).toBe('POST');
  });

  it('sorts by changeType', () => {
    const result = sortChanges(changes, { field: 'changeType' });
    expect(result[0].type).toBe('added');
    expect(result[1].type).toBe('modified');
    expect(result[2].type).toBe('removed');
  });

  it('does not mutate original array', () => {
    const original = [...changes];
    sortChanges(changes, { field: 'path' });
    expect(changes[0].route.path).toBe(original[0].route.path);
  });
});

describe('formatSortText', () => {
  it('includes sort header and entries', () => {
    const changes = [makeChange('/api', 'GET', 'added')];
    const text = formatSortText(changes, { field: 'path', order: 'asc' });
    expect(text).toContain('Sorted by path (asc)');
    expect(text).toContain('[added] GET /api');
  });
});
