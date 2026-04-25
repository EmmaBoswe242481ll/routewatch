import { digestChange, digestChanges, groupByDigest, getSummary, formatDigestText } from '../digester';
import type { RouteChange } from '../../diff/types';

function makeChange(path: string, method = 'GET', type: RouteChange['type'] = 'added'): RouteChange {
  return {
    type,
    route: { path, method, params: ['id'] },
  } as RouteChange;
}

describe('digestChange', () => {
  it('produces a hex digest string', () => {
    const change = makeChange('/api/users');
    const result = digestChange(change, { algorithm: 'sha256' });
    expect(result.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(result.algorithm).toBe('sha256');
  });

  it('applies a prefix when configured', () => {
    const change = makeChange('/api/items');
    const result = digestChange(change, { algorithm: 'md5', prefix: 'rw-' });
    expect(result.digest.startsWith('rw-')).toBe(true);
  });

  it('uses specified fields', () => {
    const change = makeChange('/api/orders', 'POST');
    const r1 = digestChange(change, { algorithm: 'sha1', fields: ['path'] });
    const r2 = digestChange(change, { algorithm: 'sha1', fields: ['path', 'method'] });
    expect(r1.digest).not.toBe(r2.digest);
    expect(r1.fields).toEqual(['path']);
  });

  it('same inputs produce same digest', () => {
    const c1 = makeChange('/api/x');
    const c2 = makeChange('/api/x');
    const d1 = digestChange(c1, { algorithm: 'sha256' });
    const d2 = digestChange(c2, { algorithm: 'sha256' });
    expect(d1.digest).toBe(d2.digest);
  });
});

describe('digestChanges', () => {
  it('returns one result per change', () => {
    const changes = [makeChange('/a'), makeChange('/b'), makeChange('/c')];
    const results = digestChanges(changes, { algorithm: 'sha256' });
    expect(results).toHaveLength(3);
  });
});

describe('groupByDigest', () => {
  it('groups identical digests together', () => {
    const changes = [makeChange('/same'), makeChange('/same'), makeChange('/other')];
    const digested = digestChanges(changes, { algorithm: 'sha256' });
    const groups = groupByDigest(digested);
    const sizes = Object.values(groups).map((g) => g.length);
    expect(sizes).toContain(2);
    expect(sizes).toContain(1);
  });
});

describe('getSummary', () => {
  it('reports collisions correctly', () => {
    const changes = [makeChange('/dup'), makeChange('/dup'), makeChange('/unique')];
    const digested = digestChanges(changes, { algorithm: 'sha256' });
    const summary = getSummary(digested);
    expect(summary.total).toBe(3);
    expect(summary.unique).toBe(2);
    expect(summary.collisions).toBe(1);
  });
});

describe('formatDigestText', () => {
  it('returns a no-changes message for empty input', () => {
    expect(formatDigestText([])).toBe('No changes digested.');
  });

  it('includes algorithm and field info', () => {
    const changes = [makeChange('/api/test', 'DELETE', 'removed')];
    const digested = digestChanges(changes, { algorithm: 'sha512' });
    const text = formatDigestText(digested);
    expect(text).toContain('sha512');
    expect(text).toContain('/api/test');
  });
});
