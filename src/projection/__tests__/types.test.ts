import { buildProjectionResult, projectionsToTable } from '../types';

describe('buildProjectionResult', () => {
  it('builds result with correct shape', () => {
    const rows = [{ path: '/api/users', method: 'GET' }];
    const result = buildProjectionResult(['path', 'method'], rows);
    expect(result.total).toBe(1);
    expect(result.fields).toEqual(['path', 'method']);
    expect(result.rows).toBe(rows);
  });

  it('handles empty rows', () => {
    const result = buildProjectionResult(['path'], []);
    expect(result.total).toBe(0);
  });
});

describe('projectionsToTable', () => {
  it('converts to 2d string array', () => {
    const result = buildProjectionResult(['path', 'method'], [
      { path: '/a', method: 'GET' },
      { path: '/b', method: 'POST' },
    ]);
    const table = projectionsToTable(result);
    expect(table).toEqual([['/ a', 'GET'], ['/b', 'POST']]);
  });

  it('uses empty string for missing values', () => {
    const result = buildProjectionResult(['path', 'method'], [{ path: '/a' }]);
    const table = projectionsToTable(result);
    expect(table[0][1]).toBe('');
  });
});
