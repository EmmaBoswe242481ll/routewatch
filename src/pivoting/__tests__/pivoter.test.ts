import { pivotChanges, formatPivotText } from '../pivoter';
import { RouteChange } from '../../diff/types';

function makeChange(overrides: Partial<RouteChange> = {}): RouteChange {
  return {
    path: '/api/users',
    method: 'GET',
    changeType: 'added',
    breaking: false,
    ...overrides,
  } as RouteChange;
}

describe('pivotChanges', () => {
  const changes = [
    makeChange({ method: 'GET', changeType: 'added', path: '/api/users' }),
    makeChange({ method: 'POST', changeType: 'added', path: '/api/users' }),
    makeChange({ method: 'GET', changeType: 'removed', path: '/api/posts', breaking: true }),
    makeChange({ method: 'DELETE', changeType: 'removed', path: '/api/posts', breaking: true }),
    makeChange({ method: 'GET', changeType: 'modified', path: '/auth/login' }),
  ];

  it('pivots by method', () => {
    const result = pivotChanges(changes, 'method');
    expect(result.field).toBe('method');
    expect(result.total).toBe(5);
    const getEntry = result.entries.find(e => e.key === 'GET');
    expect(getEntry?.count).toBe(3);
  });

  it('pivots by changeType', () => {
    const result = pivotChanges(changes, 'changeType');
    const added = result.entries.find(e => e.key === 'added');
    const removed = result.entries.find(e => e.key === 'removed');
    expect(added?.count).toBe(2);
    expect(removed?.count).toBe(2);
  });

  it('pivots by prefix', () => {
    const result = pivotChanges(changes, 'prefix');
    const api = result.entries.find(e => e.key === '/api');
    expect(api?.count).toBe(4);
  });

  it('pivots by status', () => {
    const result = pivotChanges(changes, 'status');
    const breaking = result.entries.find(e => e.key === 'breaking');
    expect(breaking?.count).toBe(2);
  });

  it('sorts entries by count descending', () => {
    const result = pivotChanges(changes, 'method');
    expect(result.entries[0].count).toBeGreaterThanOrEqual(result.entries[1].count);
  });

  it('handles empty changes', () => {
    const result = pivotChanges([], 'method');
    expect(result.entries).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});

describe('formatPivotText', () => {
  it('formats pivot result as text', () => {
    const result = pivotChanges(
      [makeChange({ method: 'GET' }), makeChange({ method: 'GET' }), makeChange({ method: 'POST' })],
      'method'
    );
    const text = formatPivotText(result);
    expect(text).toContain('method');
    expect(text).toContain('GET: 2');
    expect(text).toContain('POST: 1');
  });
});
