import { buildBlendSummary, BlendResult } from '../types';

describe('buildBlendSummary', () => {
  it('formats summary with strategy counts', () => {
    const result: BlendResult = {
      changes: [],
      totalBlended: 5,
      strategyCounts: { merge: 3, override: 2 },
    };
    const text = buildBlendSummary(result);
    expect(text).toContain('Total blended: 5');
    expect(text).toContain('merge: 3');
    expect(text).toContain('override: 2');
  });

  it('handles empty strategy counts', () => {
    const result: BlendResult = {
      changes: [],
      totalBlended: 0,
      strategyCounts: {},
    };
    const text = buildBlendSummary(result);
    expect(text).toContain('Total blended: 0');
  });
});
