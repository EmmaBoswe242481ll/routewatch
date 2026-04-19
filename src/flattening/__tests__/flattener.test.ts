import { flattenChange, flattenChanges, flattenToRows, formatFlattenText } from '../flattener';
import { RouteChange } from '../../diff/types';

function makeChange(overrides: Partial<RouteChange> = {}): RouteChange {
  return {
    type: 'modified',
    route: { path: '/api/users', method: 'GET', params: [] },
    before: { path: '/api/users', method: 'GET', params: [] },
    after: { path: '/api/users', method: 'GET', params: ['id'] },
    ...overrides,
  } as RouteChange;
}

describe('flattenChange', () => {
  it('flattens a single change', () => {
    const result = flattenChange(makeChange());
    expect(result.path).toBe('/api/users');
    expect(result.method).toBe('GET');
    expect(result.changeType).toBe('modified');
    expect(result.paramsAfter).toEqual(['id']);
  });

  it('handles added change with no before', () => {
    const change = makeChange({ type: 'added', before: undefined });
    const result = flattenChange(change);
    expect(result.paramsBefore).toEqual([]);
    expect(result.oldPath).toBeUndefined();
  });
});

describe('flattenChanges', () => {
  it('returns empty array for no changes', () => {
    expect(flattenChanges([])).toEqual([]);
  });

  it('flattens multiple changes', () => {
    const changes = [makeChange(), makeChange({ type: 'added' })];
    const result = flattenChanges(changes);
    expect(result).toHaveLength(2);
  });
});

describe('flattenToRows', () => {
  it('includes header row', () => {
    const rows = flattenToRows([makeChange()]);
    expect(rows[0]).toContain('path');
    expect(rows[0]).toContain('method');
  });

  it('has correct number of rows', () => {
    const rows = flattenToRows([makeChange(), makeChange()]);
    expect(rows).toHaveLength(3); // header + 2
  });
});

describe('formatFlattenText', () => {
  it('returns message for empty list', () => {
    expect(formatFlattenText([])).toBe('No changes to flatten.');
  });

  it('formats changes as text', () => {
    const result = formatFlattenText([makeChange()]);
    expect(result).toContain('Flattened 1 change(s)');
    expect(result).toContain('GET /api/users');
  });
});
