import { buildTraceSummary, TraceResult } from '../types';

describe('buildTraceSummary', () => {
  it('formats a summary string from a TraceResult', () => {
    const result: TraceResult = {
      traced: [
        {
          path: '/api/users',
          method: 'GET',
          changeType: 'added',
          traceId: 'abc123def456',
          label: 'api-surface',
          tracedAt: new Date().toISOString(),
        },
      ],
      untraced: 3,
      totalInput: 4,
    };
    const summary = buildTraceSummary(result);
    expect(summary).toBe('traced=1 untraced=3 total=4');
  });

  it('handles empty traced array', () => {
    const result: TraceResult = { traced: [], untraced: 5, totalInput: 5 };
    const summary = buildTraceSummary(result);
    expect(summary).toBe('traced=0 untraced=5 total=5');
  });
});
