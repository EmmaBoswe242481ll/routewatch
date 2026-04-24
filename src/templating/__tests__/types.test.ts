import { buildTemplateResult } from '../types';
import type { TemplatedChange } from '../types';

function makeTemplated(overrides: Partial<TemplatedChange> = {}): TemplatedChange {
  return {
    path: '/api/test',
    method: 'GET',
    type: 'added',
    rendered: 'GET /api/test added',
    ...overrides,
  };
}

describe('buildTemplateResult', () => {
  it('counts matched changes (those with a rule)', () => {
    const changes = [
      makeTemplated({ rule: '/api/*' }),
      makeTemplated(),
      makeTemplated({ rule: '/health' }),
    ];
    const result = buildTemplateResult(changes);
    expect(result.matched).toBe(2);
    expect(result.unmatched).toBe(1);
    expect(result.changes).toHaveLength(3);
  });

  it('returns zero counts for empty input', () => {
    const result = buildTemplateResult([]);
    expect(result.matched).toBe(0);
    expect(result.unmatched).toBe(0);
    expect(result.changes).toHaveLength(0);
  });

  it('handles all unmatched', () => {
    const changes = [makeTemplated(), makeTemplated()];
    const result = buildTemplateResult(changes);
    expect(result.matched).toBe(0);
    expect(result.unmatched).toBe(2);
  });

  it('handles all matched', () => {
    const changes = [
      makeTemplated({ rule: '/a' }),
      makeTemplated({ rule: '/b' }),
    ];
    const result = buildTemplateResult(changes);
    expect(result.matched).toBe(2);
    expect(result.unmatched).toBe(0);
  });
});
