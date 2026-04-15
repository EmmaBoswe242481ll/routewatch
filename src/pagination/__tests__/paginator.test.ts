import {
  paginate,
  paginateChanges,
  formatPaginationText,
} from '../paginator';
import { RouteChange } from '../../diff/types';

function makeItems(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i + 1);
}

function makeChange(path: string): RouteChange {
  return {
    type: 'added',
    route: { method: 'GET', path, params: [], framework: 'nextjs', filePath: 'f.ts' },
  } as RouteChange;
}

describe('paginate', () => {
  it('returns correct slice for first page', () => {
    const result = paginate(makeItems(10), { page: 1, pageSize: 3 });
    expect(result.items).toEqual([1, 2, 3]);
    expect(result.totalItems).toBe(10);
    expect(result.totalPages).toBe(4);
    expect(result.hasNextPage).toBe(true);
    expect(result.hasPrevPage).toBe(false);
  });

  it('returns correct slice for last page', () => {
    const result = paginate(makeItems(10), { page: 4, pageSize: 3 });
    expect(result.items).toEqual([10]);
    expect(result.hasNextPage).toBe(false);
    expect(result.hasPrevPage).toBe(true);
  });

  it('handles empty array', () => {
    const result = paginate([], { page: 1, pageSize: 5 });
    expect(result.items).toEqual([]);
    expect(result.totalPages).toBe(0);
    expect(result.hasNextPage).toBe(false);
  });

  it('throws on invalid page', () => {
    expect(() => paginate(makeItems(5), { page: 0, pageSize: 2 })).toThrow('page must be >= 1');
  });

  it('throws on invalid pageSize', () => {
    expect(() => paginate(makeItems(5), { page: 1, pageSize: 0 })).toThrow('pageSize must be >= 1');
  });

  it('returns single page when items fit', () => {
    const result = paginate(makeItems(3), { page: 1, pageSize: 10 });
    expect(result.totalPages).toBe(1);
    expect(result.items.length).toBe(3);
  });
});

describe('paginateChanges', () => {
  it('paginates RouteChange arrays', () => {
    const changes = ['/a', '/b', '/c', '/d'].map(makeChange);
    const result = paginateChanges(changes, { page: 2, pageSize: 2 });
    expect(result.items.length).toBe(2);
    expect(result.items[0].route.path).toBe('/c');
  });
});

describe('formatPaginationText', () => {
  it('includes page info and navigation hints', () => {
    const result = paginate(makeItems(20), { page: 2, pageSize: 5 });
    const text = formatPaginationText(result);
    expect(text).toContain('Page 2 of 4');
    expect(text).toContain('Next page: 3');
    expect(text).toContain('Prev page: 1');
  });

  it('omits next page hint on last page', () => {
    const result = paginate(makeItems(5), { page: 1, pageSize: 10 });
    const text = formatPaginationText(result);
    expect(text).not.toContain('Next page');
  });
});
