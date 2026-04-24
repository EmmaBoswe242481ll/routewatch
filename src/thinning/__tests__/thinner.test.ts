import {
  thinChanges,
  thinByPrefix,
  thinByMethod,
  formatThinText,
} from '../thinner';
import { RouteChange } from '../../diff/types';

function makeChange(method: string, path: string): RouteChange {
  return {
    type: 'added',
    route: { method, path, params: [] },
  } as unknown as RouteChange;
}

describe('thinByPrefix', () => {
  it('keeps up to maxPerPrefix per prefix group', () => {
    const changes = [
      makeChange('GET', '/api/users'),
      makeChange('POST', '/api/users'),
      makeChange('DELETE', '/api/users'),
      makeChange('GET', '/health'),
    ];
    const { kept, dropped } = thinByPrefix(changes, 2);
    expect(kept).toHaveLength(3);
    expect(dropped).toHaveLength(1);
    expect(dropped[0].route.path).toBe('/api/users');
  });

  it('returns all when under limit', () => {
    const changes = [makeChange('GET', '/a'), makeChange('GET', '/b')];
    const { kept, dropped } = thinByPrefix(changes, 5);
    expect(kept).toHaveLength(2);
    expect(dropped).toHaveLength(0);
  });
});

describe('thinByMethod', () => {
  it('keeps up to maxPerMethod per method group', () => {
    const changes = [
      makeChange('GET', '/a'),
      makeChange('GET', '/b'),
      makeChange('GET', '/c'),
      makeChange('POST', '/a'),
    ];
    const { kept, dropped } = thinByMethod(changes, 2);
    expect(kept).toHaveLength(3);
    expect(dropped).toHaveLength(1);
    expect(dropped[0].route.method).toBe('GET');
  });
});

describe('thinChanges', () => {
  it('applies total cap', () => {
    const changes = [
      makeChange('GET', '/a'),
      makeChange('GET', '/b'),
      makeChange('GET', '/c'),
    ];
    const result = thinChanges(changes, { maxTotal: 2 });
    expect(result.kept).toHaveLength(2);
    expect(result.dropped).toHaveLength(1);
    expect(result.totalIn).toBe(3);
    expect(result.totalOut).toBe(2);
  });

  it('applies prefix strategy', () => {
    const changes = [
      makeChange('GET', '/api/a'),
      makeChange('POST', '/api/b'),
      makeChange('DELETE', '/api/c'),
      makeChange('GET', '/v2/a'),
    ];
    const result = thinChanges(changes, { strategy: 'prefix', maxPerPrefix: 1 });
    expect(result.kept).toHaveLength(2);
    expect(result.dropped).toHaveLength(2);
  });

  it('applies method strategy', () => {
    const changes = [
      makeChange('GET', '/a'),
      makeChange('GET', '/b'),
      makeChange('POST', '/c'),
    ];
    const result = thinChanges(changes, { strategy: 'method', maxPerMethod: 1 });
    expect(result.kept).toHaveLength(2);
    expect(result.dropped).toHaveLength(1);
  });

  it('returns all when no config applied', () => {
    const changes = [makeChange('GET', '/a'), makeChange('POST', '/b')];
    const result = thinChanges(changes);
    expect(result.kept).toHaveLength(2);
    expect(result.dropped).toHaveLength(0);
  });
});

describe('formatThinText', () => {
  it('formats result with dropped routes', () => {
    const changes = [
      makeChange('GET', '/a'),
      makeChange('GET', '/b'),
      makeChange('GET', '/c'),
    ];
    const result = thinChanges(changes, { maxTotal: 2 });
    const text = formatThinText(result);
    expect(text).toContain('3 in → 2 out');
    expect(text).toContain('Dropped routes');
    expect(text).toContain('GET /c');
  });

  it('omits dropped section when nothing dropped', () => {
    const result = thinChanges([makeChange('GET', '/a')], { maxTotal: 5 });
    const text = formatThinText(result);
    expect(text).not.toContain('Dropped routes');
  });
});
