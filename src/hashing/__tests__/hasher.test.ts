import {
  hashChange,
  hashChanges,
  deduplicateByHash,
  formatHashText,
} from '../hasher';
import type { RouteChange } from '../../diff/types';

function makeChange(overrides: Partial<RouteChange> = {}): RouteChange {
  return {
    type: 'added',
    method: 'GET',
    path: '/api/test',
    params: [],
    ...overrides,
  };
}

describe('hashChange', () => {
  it('returns a sha256 hex string by default', () => {
    const hash = hashChange(makeChange());
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('returns md5 when algorithm is md5', () => {
    const hash = hashChange(makeChange(), { algorithm: 'md5' });
    expect(hash).toMatch(/^[a-f0-9]{32}$/);
  });

  it('produces different hashes for different methods', () => {
    const h1 = hashChange(makeChange({ method: 'GET' }));
    const h2 = hashChange(makeChange({ method: 'POST' }));
    expect(h1).not.toBe(h2);
  });

  it('produces different hashes for different paths', () => {
    const h1 = hashChange(makeChange({ path: '/a' }));
    const h2 = hashChange(makeChange({ path: '/b' }));
    expect(h1).not.toBe(h2);
  });

  it('excludes method when includeMethod is false', () => {
    const h1 = hashChange(makeChange({ method: 'GET' }), { includeMethod: false });
    const h2 = hashChange(makeChange({ method: 'POST' }), { includeMethod: false });
    expect(h1).toBe(h2);
  });
});

describe('hashChanges', () => {
  it('returns a HashedChange for each input', () => {
    const changes = [makeChange(), makeChange({ path: '/other' })];
    const result = hashChanges(changes);
    expect(result).toHaveLength(2);
    result.forEach(({ change, hash }) => {
      expect(change).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });
  });
});

describe('deduplicateByHash', () => {
  it('removes duplicate hashed changes', () => {
    const change = makeChange();
    const hashed = hashChanges([change, change]);
    const result = deduplicateByHash(hashed);
    expect(result).toHaveLength(1);
  });

  it('keeps unique changes', () => {
    const changes = [makeChange({ path: '/a' }), makeChange({ path: '/b' })];
    const result = deduplicateByHash(hashChanges(changes));
    expect(result).toHaveLength(2);
  });
});

describe('formatHashText', () => {
  it('includes count and short hash', () => {
    const hashed = hashChanges([makeChange()]);
    const text = formatHashText(hashed);
    expect(text).toContain('Hashed Changes (1)');
    expect(text).toContain('GET');
    expect(text).toContain('/api/test');
  });
});
