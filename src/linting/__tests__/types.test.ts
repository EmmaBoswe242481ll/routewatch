import { buildLintSummary } from '../types';

describe('buildLintSummary', () => {
  it('returns correct counts with no failures', () => {
    const summary = buildLintSummary([], 10);
    expect(summary.total).toBe(10);
    expect(summary.passed).toBe(10);
    expect(summary.failed).toBe(0);
    expect(summary.errorsByRule).toEqual({});
  });

  it('aggregates errors by rule id', () => {
    const results = [
      { ruleId: 'no-trailing-slash' },
      { ruleId: 'no-trailing-slash' },
      { ruleId: 'method-uppercase' },
    ];
    const summary = buildLintSummary(results, 20);
    expect(summary.failed).toBe(3);
    expect(summary.passed).toBe(17);
    expect(summary.errorsByRule['no-trailing-slash']).toBe(2);
    expect(summary.errorsByRule['method-uppercase']).toBe(1);
  });
});
