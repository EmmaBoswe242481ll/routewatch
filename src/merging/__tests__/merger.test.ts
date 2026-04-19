import { mergeChangeSets, formatMergeText } from '../merger';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, method = 'GET', type: RouteChange['type'] = 'added'): RouteChange {
  return { path, method, type } as RouteChange;
}

describe('mergeChangeSets', () => {
  const left = [makeChange('/a'), makeChange('/b')];
  const right = [makeChange('/b'), makeChange('/c')];

  it('union combines all changes', () => {
    const result = mergeChangeSets(left, right, { strategy: 'union' });
    expect(result.mergedCount).toBe(4);
    expect(result.strategy).toBe('union');
  });

  it('union with dedup removes duplicates', () => {
    const result = mergeChangeSets(left, right, { strategy: 'union', deduplicateByKey: true });
    expect(result.mergedCount).toBe(3);
  });

  it('intersection returns common keys', () => {
    const result = mergeChangeSets(left, right, { strategy: 'intersection' });
    expect(result.mergedCount).toBe(1);
    expect(result.changes[0].path).toBe('/b');
  });

  it('left returns only left changes', () => {
    const result = mergeChangeSets(left, right, { strategy: 'left' });
    expect(result.changes).toEqual(left);
    expect(result.mergedCount).toBe(2);
  });

  it('right returns only right changes', () => {
    const result = mergeChangeSets(left, right, { strategy: 'right' });
    expect(result.changes).toEqual(right);
    expect(result.mergedCount).toBe(2);
  });

  it('tracks left and right counts', () => {
    const result = mergeChangeSets(left, right, { strategy: 'union' });
    expect(result.leftCount).toBe(2);
    expect(result.rightCount).toBe(2);
  });
});

describe('formatMergeText', () => {
  it('includes strategy and counts', () => {
    const result = mergeChangeSets(
      [makeChange('/a')],
      [makeChange('/b')],
      { strategy: 'union' }
    );
    const text = formatMergeText(result);
    expect(text).toContain('union');
    expect(text).toContain('2');
  });
});
