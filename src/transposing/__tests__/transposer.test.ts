import {
  transposeChange,
  transposeChanges,
  buildTransposeSummary,
  formatTransposeText,
  TransposeRule,
} from '../transposer';
import { RouteChange } from '../../diff/types';

function makeChange(method: string, path: string): RouteChange {
  return { method, path, type: 'modified', params: [] };
}

const rules: TransposeRule[] = [
  { fromMethod: 'GET', toMethod: 'POST', pathPattern: '/api/*' },
  { fromMethod: 'DELETE', toMethod: 'PATCH' },
];

describe('transposeChange', () => {
  it('transposes when method and path pattern match', () => {
    const change = makeChange('GET', '/api/users');
    const result = transposeChange(change, rules);
    expect(result).not.toBeNull();
    expect(result!.transposed.method).toBe('POST');
    expect(result!.transposed.path).toBe('/api/users');
  });

  it('returns null when method does not match any rule', () => {
    const change = makeChange('PUT', '/api/users');
    const result = transposeChange(change, rules);
    expect(result).toBeNull();
  });

  it('returns null when path does not match pattern', () => {
    const change = makeChange('GET', '/health');
    const result = transposeChange(change, rules);
    expect(result).toBeNull();
  });

  it('transposes when no pathPattern is specified', () => {
    const change = makeChange('DELETE', '/anything/goes');
    const result = transposeChange(change, rules);
    expect(result).not.toBeNull();
    expect(result!.transposed.method).toBe('PATCH');
  });

  it('preserves other fields on the transposed change', () => {
    const change = makeChange('DELETE', '/orders/1');
    const result = transposeChange(change, rules);
    expect(result!.transposed.path).toBe('/orders/1');
    expect(result!.transposed.type).toBe('modified');
  });
});

describe('transposeChanges', () => {
  it('applies rules to matching changes and passes through the rest', () => {
    const changes = [
      makeChange('GET', '/api/items'),
      makeChange('GET', '/health'),
      makeChange('DELETE', '/api/items/1'),
    ];
    const { changes: output, results } = transposeChanges(changes, rules);
    expect(output[0].method).toBe('POST');
    expect(output[1].method).toBe('GET');
    expect(output[2].method).toBe('PATCH');
    expect(results).toHaveLength(2);
  });

  it('returns empty results when no rules match', () => {
    const changes = [makeChange('PUT', '/foo'), makeChange('HEAD', '/bar')];
    const { changes: output, results } = transposeChanges(changes, rules);
    expect(results).toHaveLength(0);
    expect(output).toHaveLength(2);
  });
});

describe('buildTransposeSummary', () => {
  it('computes correct counts', () => {
    const changes = [makeChange('GET', '/api/a'), makeChange('DELETE', '/b')];
    const { results } = transposeChanges(changes, rules);
    const summary = buildTransposeSummary(results, changes.length);
    expect(summary.total).toBe(2);
    expect(summary.transposed).toBe(2);
    expect(summary.unchanged).toBe(0);
  });
});

describe('formatTransposeText', () => {
  it('formats summary as text', () => {
    const text = formatTransposeText({ total: 5, transposed: 3, unchanged: 2 });
    expect(text).toContain('Total   : 5');
    expect(text).toContain('Transposed: 3');
    expect(text).toContain('Unchanged : 2');
  });
});
