import {
  sealChanges,
  filterUnsealed,
  buildSealSummary,
  formatSealText,
  isSealed,
  SealRule,
} from '../sealer';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, method = 'GET'): RouteChange {
  return {
    type: 'modified',
    path,
    method,
    before: { path, method, params: [] },
    after: { path, method, params: [] },
  };
}

const rules: SealRule[] = [
  { pattern: '/admin/*', reason: 'Admin routes are frozen' },
  { pattern: '/internal/health', reason: 'Health endpoint sealed' },
];

describe('isSealed', () => {
  it('returns matching rule for sealed path', () => {
    const change = makeChange('/admin/users');
    const result = isSealed(change, rules);
    expect(result).toBeDefined();
    expect(result?.reason).toBe('Admin routes are frozen');
  });

  it('returns undefined for non-sealed path', () => {
    const change = makeChange('/api/users');
    expect(isSealed(change, rules)).toBeUndefined();
  });

  it('matches exact sealed path', () => {
    const change = makeChange('/internal/health');
    const result = isSealed(change, rules);
    expect(result?.reason).toBe('Health endpoint sealed');
  });
});

describe('sealChanges', () => {
  it('marks sealed changes correctly', () => {
    const changes = [makeChange('/admin/settings'), makeChange('/api/products')];
    const results = sealChanges(changes, rules);
    expect(results[0].sealed).toBe(true);
    expect(results[0].reason).toBe('Admin routes are frozen');
    expect(results[1].sealed).toBe(false);
  });

  it('returns all results with same length', () => {
    const changes = [makeChange('/a'), makeChange('/b'), makeChange('/admin/x')];
    expect(sealChanges(changes, rules)).toHaveLength(3);
  });
});

describe('filterUnsealed', () => {
  it('returns only unsealed changes', () => {
    const changes = [makeChange('/admin/x'), makeChange('/api/items')];
    const results = sealChanges(changes, rules);
    const unsealed = filterUnsealed(results);
    expect(unsealed).toHaveLength(1);
    expect(unsealed[0].path).toBe('/api/items');
  });
});

describe('buildSealSummary', () => {
  it('builds correct summary counts', () => {
    const changes = [makeChange('/admin/x'), makeChange('/api/a'), makeChange('/api/b')];
    const results = sealChanges(changes, rules);
    const summary = buildSealSummary(results);
    expect(summary.total).toBe(3);
    expect(summary.sealed).toBe(1);
    expect(summary.unsealed).toBe(2);
  });
});

describe('formatSealText', () => {
  it('formats summary as readable text', () => {
    const text = formatSealText({ total: 5, sealed: 2, unsealed: 3 });
    expect(text).toContain('Sealing Summary');
    expect(text).toContain('Total   : 5');
    expect(text).toContain('Sealed  : 2');
    expect(text).toContain('Unsealed: 3');
  });
});
