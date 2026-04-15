import {
  deduplicateChanges,
  mergeChangeSets,
  formatDeduplicationText,
  changeKey,
} from '../deduplicator';
import { RouteChange } from '../../diff/types';

function makeChange(overrides: Partial<RouteChange> = {}): RouteChange {
  return {
    type: 'added',
    method: 'GET',
    path: '/api/test',
    ...overrides,
  } as RouteChange;
}

describe('changeKey', () => {
  it('produces a stable key from method, path, and type', () => {
    const change = makeChange();
    expect(changeKey(change)).toBe('GET:/api/test:added');
  });
});

describe('deduplicateChanges', () => {
  it('returns all changes when there are no duplicates', () => {
    const changes = [
      makeChange({ path: '/api/a' }),
      makeChange({ path: '/api/b' }),
    ];
    const result = deduplicateChanges(changes);
    expect(result.unique).toHaveLength(2);
    expect(result.duplicates).toHaveLength(0);
    expect(result.deduplicatedCount).toBe(0);
  });

  it('identifies duplicate changes with the same key', () => {
    const change = makeChange();
    const result = deduplicateChanges([change, { ...change }, { ...change }]);
    expect(result.unique).toHaveLength(1);
    expect(result.duplicates).toHaveLength(2);
    expect(result.deduplicatedCount).toBe(2);
  });

  it('keeps the first occurrence as the unique entry', () => {
    const first = makeChange({ path: '/api/first' });
    const second = makeChange({ path: '/api/first' });
    const result = deduplicateChanges([first, second]);
    expect(result.unique[0]).toBe(first);
  });

  it('handles an empty array', () => {
    const result = deduplicateChanges([]);
    expect(result.unique).toHaveLength(0);
    expect(result.deduplicatedCount).toBe(0);
  });
});

describe('mergeChangeSets', () => {
  it('combines two disjoint sets', () => {
    const primary = [makeChange({ path: '/api/a' })];
    const secondary = [makeChange({ path: '/api/b' })];
    const merged = mergeChangeSets(primary, secondary);
    expect(merged).toHaveLength(2);
  });

  it('primary changes take precedence over secondary duplicates', () => {
    const primary = [makeChange({ path: '/api/a' })];
    const secondary = [makeChange({ path: '/api/a' })];
    const merged = mergeChangeSets(primary, secondary);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toBe(primary[0]);
  });

  it('returns empty array when both inputs are empty', () => {
    expect(mergeChangeSets([], [])).toHaveLength(0);
  });
});

describe('formatDeduplicationText', () => {
  it('renders summary text with counts', () => {
    const result = { unique: [makeChange()], duplicates: [makeChange()], deduplicatedCount: 1 };
    const text = formatDeduplicationText(result);
    expect(text).toContain('Unique changes  : 1');
    expect(text).toContain('Duplicates found: 1');
  });
});
