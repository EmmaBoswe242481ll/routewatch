import { buildEncodingSummary } from '../types';
import type { EncodedChange } from '../encoder';
import type { RouteChange } from '../../diff/types';

function makeEncoded(): EncodedChange {
  return {
    original: { type: 'added', path: '/api/x', method: 'GET' } as RouteChange,
    encoded: { path: 'L2FwaS94' },
  };
}

describe('buildEncodingSummary', () => {
  it('builds summary with correct total', () => {
    const results = [makeEncoded(), makeEncoded()];
    const summary = buildEncodingSummary(results, 'base64', ['path']);
    expect(summary.total).toBe(2);
    expect(summary.format).toBe('base64');
    expect(summary.fields).toEqual(['path']);
  });

  it('handles empty results', () => {
    const summary = buildEncodingSummary([], 'uri', []);
    expect(summary.total).toBe(0);
  });
});
