import { buildMergeSummary, MergeResult } from '../types';

describe('buildMergeSummary', () => {
  it('formats a summary string', () => {
    const result: MergeResult = {
      changes: [],
      leftCount: 3,
      rightCount: 5,
      mergedCount: 7,
      strategy: 'union',
    };
    const text = buildMergeSummary(result);
    expect(text).toContain('union');
    expect(text).toContain('7');
    expect(text).toContain('left=3');
    expect(text).toContain('right=5');
  });

  it('works for intersection strategy', () => {
    const result: MergeResult = {
      changes: [],
      leftCount: 4,
      rightCount: 4,
      mergedCount: 2,
      strategy: 'intersection',
    };
    const text = buildMergeSummary(result);
    expect(text).toContain('intersection');
    expect(text).toContain('2');
  });
});
