import { zipChanges, formatZipText } from '../zipper';
import { RouteChange } from '../../diff/types';

function makeChange(method: string, path: string, type: RouteChange['type'] = 'modified'): RouteChange {
  return { method, path, type };
}

describe('zipChanges', () => {
  it('pairs changes with matching method and path', () => {
    const left = [makeChange('GET', '/users')];
    const right = [makeChange('GET', '/users', 'modified')];
    const result = zipChanges(left, right);
    expect(result.pairs).toHaveLength(1);
    expect(result.leftOnly).toHaveLength(0);
    expect(result.rightOnly).toHaveLength(0);
  });

  it('puts unmatched left items in leftOnly', () => {
    const left = [makeChange('GET', '/users'), makeChange('POST', '/items')];
    const right = [makeChange('GET', '/users')];
    const result = zipChanges(left, right);
    expect(result.pairs).toHaveLength(1);
    expect(result.leftOnly).toHaveLength(1);
    expect(result.leftOnly[0].path).toBe('/items');
  });

  it('puts unmatched right items in rightOnly', () => {
    const left = [makeChange('GET', '/users')];
    const right = [makeChange('GET', '/users'), makeChange('DELETE', '/orders')];
    const result = zipChanges(left, right);
    expect(result.pairs).toHaveLength(1);
    expect(result.rightOnly).toHaveLength(1);
    expect(result.rightOnly[0].path).toBe('/orders');
  });

  it('returns empty result for empty inputs', () => {
    const result = zipChanges([], []);
    expect(result.pairs).toHaveLength(0);
    expect(result.leftOnly).toHaveLength(0);
    expect(result.rightOnly).toHaveLength(0);
  });

  it('distinguishes by method', () => {
    const left = [makeChange('GET', '/users')];
    const right = [makeChange('POST', '/users')];
    const result = zipChanges(left, right);
    expect(result.pairs).toHaveLength(0);
    expect(result.leftOnly).toHaveLength(1);
    expect(result.rightOnly).toHaveLength(1);
  });
});

describe('formatZipText', () => {
  it('includes summary line', () => {
    const left = [makeChange('GET', '/a')];
    const right = [makeChange('GET', '/a'), makeChange('POST', '/b')];
    const result = zipChanges(left, right);
    const text = formatZipText(result);
    expect(text).toContain('1 paired');
    expect(text).toContain('1 right-only');
    expect(text).toContain('PAIR');
    expect(text).toContain('RIGHT');
  });
});
