import { compressChange, compressChanges, formatCompressionText } from '../compressor';
import { RouteChange } from '../../diff/types';

function makeChange(overrides: Partial<RouteChange> = {}): RouteChange {
  return {
    type: 'added',
    method: 'GET',
    path: '/api/users',
    description: 'Route added',
    paramChanges: { added: [], removed: [] },
    ...overrides,
  };
}

describe('compressChange', () => {
  it('produces compact key from method and path', () => {
    const result = compressChange(makeChange());
    expect(result.k).toBe('GET:/api/users');
  });

  it('includes type', () => {
    const result = compressChange(makeChange({ type: 'removed' }));
    expect(result.t).toBe('removed');
  });

  it('includes param changes by default', () => {
    const result = compressChange(makeChange({ paramChanges: { added: ['id'], removed: ['slug'] } }));
    expect(result.p).toEqual(['id']);
    expect(result.r).toEqual(['slug']);
  });

  it('omits params when compactParams is true', () => {
    const result = compressChange(
      makeChange({ paramChanges: { added: ['id'], removed: [] } }),
      { compactParams: true }
    );
    expect(result.p).toBeUndefined();
  });

  it('omits description when omitMeta is true', () => {
    const result = compressChange(makeChange(), { omitMeta: true });
    expect(result.m).toBeUndefined();
  });
});

describe('compressChanges', () => {
  it('compresses all changes', () => {
    const changes = [makeChange(), makeChange({ type: 'removed', path: '/api/posts' })];
    const result = compressChanges(changes);
    expect(result.compressedCount).toBe(2);
    expect(result.originalCount).toBe(2);
  });

  it('filters unchanged when omitUnchanged is true', () => {
    const changes = [makeChange(), makeChange({ type: 'unchanged' })];
    const result = compressChanges(changes, { omitUnchanged: true });
    expect(result.compressedCount).toBe(1);
  });

  it('reports bytes saved', () => {
    const changes = [makeChange({ description: 'A'.repeat(200) })];
    const result = compressChanges(changes, { omitMeta: true });
    expect(result.bytesSaved).toBeGreaterThan(0);
  });
});

describe('formatCompressionText', () => {
  it('returns summary string', () => {
    const result = compressChanges([makeChange()]);
    const text = formatCompressionText(result);
    expect(text).toContain('Compression');
    expect(text).toContain('Bytes saved');
  });
});
