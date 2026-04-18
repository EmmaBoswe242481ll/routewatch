import { squashChanges, formatSquashText } from '../squasher';
import { RouteChange } from '../../diff/types';

function makeChange(method: string, path: string, type: RouteChange['type'] = 'added'): RouteChange {
  return {
    type,
    route: { method, path, params: [] },
  } as RouteChange;
}

describe('squashChanges', () => {
  it('returns all changes when no duplicates', () => {
    const changes = [makeChange('GET', '/a'), makeChange('POST', '/b')];
    const result = squashChanges(changes, { groupBy: 'both' });
    expect(result.changes).toHaveLength(2);
    expect(result.originalCount).toBe(2);
    expect(result.squashedCount).toBe(2);
  });

  it('squashes duplicate path+method keeping last', () => {
    const first = makeChange('GET', '/a', 'added');
    const second = makeChange('GET', '/a', 'modified');
    const result = squashChanges([first, second], { groupBy: 'both', keepLast: true });
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].type).toBe('modified');
    expect(result.squashedCount).toBe(1);
  });

  it('squashes by path only', () => {
    const changes = [
      makeChange('GET', '/a'),
      makeChange('POST', '/a'),
      makeChange('DELETE', '/b'),
    ];
    const result = squashChanges(changes, { groupBy: 'path' });
    expect(result.changes).toHaveLength(2);
  });

  it('squashes by method only', () => {
    const changes = [
      makeChange('GET', '/a'),
      makeChange('GET', '/b'),
      makeChange('POST', '/c'),
    ];
    const result = squashChanges(changes, { groupBy: 'method' });
    expect(result.changes).toHaveLength(2);
  });

  it('keeps first when keepLast is false', () => {
    const first = makeChange('GET', '/a', 'added');
    const second = makeChange('GET', '/a', 'removed');
    const result = squashChanges([first, second], { groupBy: 'both', keepLast: false });
    expect(result.changes[0].type).toBe('added');
  });
});

describe('formatSquashText', () => {
  it('formats squash result text', () => {
    const result = { changes: [], originalCount: 10, squashedCount: 6 };
    const text = formatSquashText(result);
    expect(text).toContain('10');
    expect(text).toContain('6');
    expect(text).toContain('4');
  });
});
