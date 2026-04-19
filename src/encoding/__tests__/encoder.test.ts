import { encodeValue, encodeChange, encodeChanges, formatEncodingText } from '../encoder';
import type { RouteChange } from '../../diff/types';

function makeChange(overrides: Partial<RouteChange> = {}): RouteChange {
  return {
    type: 'added',
    path: '/api/users',
    method: 'GET',
    ...overrides,
  } as RouteChange;
}

describe('encodeValue', () => {
  it('encodes base64', () => {
    expect(encodeValue('/api/users', 'base64')).toBe(Buffer.from('/api/users').toString('base64'));
  });

  it('encodes uri', () => {
    expect(encodeValue('/api/users?q=1', 'uri')).toBe(encodeURIComponent('/api/users?q=1'));
  });

  it('encodes hex', () => {
    expect(encodeValue('GET', 'hex')).toBe(Buffer.from('GET').toString('hex'));
  });
});

describe('encodeChange', () => {
  it('encodes path by default', () => {
    const result = encodeChange(makeChange(), { format: 'base64' });
    expect(result.encoded.path).toBe(Buffer.from('/api/users').toString('base64'));
    expect(result.encoded.method).toBeUndefined();
  });

  it('encodes specified fields', () => {
    const result = encodeChange(makeChange(), { format: 'hex', fields: ['path', 'method'] });
    expect(result.encoded.path).toBeDefined();
    expect(result.encoded.method).toBeDefined();
  });

  it('preserves original change', () => {
    const change = makeChange();
    const result = encodeChange(change, { format: 'uri' });
    expect(result.original).toBe(change);
  });
});

describe('encodeChanges', () => {
  it('encodes all changes', () => {
    const changes = [makeChange(), makeChange({ path: '/api/posts', method: 'POST' })];
    const results = encodeChanges(changes, { format: 'base64' });
    expect(results).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    expect(encodeChanges([], { format: 'uri' })).toEqual([]);
  });
});

describe('formatEncodingText', () => {
  it('returns message for empty results', () => {
    expect(formatEncodingText([])).toBe('No changes encoded.');
  });

  it('formats results correctly', () => {
    const change = makeChange();
    const results = encodeChanges([change], { format: 'base64' });
    const text = formatEncodingText(results);
    expect(text).toContain('Encoded 1 change(s)');
    expect(text).toContain('/api/users');
  });
});
