import { offsetChanges, formatOffsetText } from '../offsetter';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, method = 'GET'): RouteChange {
  return { type: 'added', path, method, params: [] };
}

describe('offsetChanges', () => {
  const changes = [
    makeChange('/a'),
    makeChange('/b'),
    makeChange('/c'),
    makeChange('/d'),
    makeChange('/e'),
  ];

  it('skips the first N changes', () => {
    const result = offsetChanges(changes, { skip: 2 });
    expect(result.changes).toHaveLength(3);
    expect(result.changes[0].path).toBe('/c');
    expect(result.skip).toBe(2);
    expect(result.total).toBe(5);
    expect(result.remaining).toBe(0);
  });

  it('applies limit after skip', () => {
    const result = offsetChanges(changes, { skip: 1, limit: 2 });
    expect(result.changes).toHaveLength(2);
    expect(result.changes[0].path).toBe('/b');
    expect(result.changes[1].path).toBe('/c');
    expect(result.remaining).toBe(2);
  });

  it('returns empty array when skip exceeds total', () => {
    const result = offsetChanges(changes, { skip: 10 });
    expect(result.changes).toHaveLength(0);
    expect(result.remaining).toBe(0);
  });

  it('returns all changes when skip is 0 and no limit', () => {
    const result = offsetChanges(changes, { skip: 0 });
    expect(result.changes).toHaveLength(5);
    expect(result.limit).toBeUndefined();
  });

  it('handles skip=0 with limit', () => {
    const result = offsetChanges(changes, { skip: 0, limit: 3 });
    expect(result.changes).toHaveLength(3);
    expect(result.remaining).toBe(2);
  });
});

describe('formatOffsetText', () => {
  it('formats result with changes', () => {
    const result = offsetChanges(
      [makeChange('/x'), makeChange('/y')],
      { skip: 0, limit: 2 }
    );
    const text = formatOffsetText(result);
    expect(text).toContain('skip=0');
    expect(text).toContain('limit=2');
    expect(text).toContain('/x');
    expect(text).toContain('/y');
  });

  it('shows no changes message when empty', () => {
    const result = offsetChanges([], { skip: 0 });
    const text = formatOffsetText(result);
    expect(text).toContain('No changes in range.');
  });
});
