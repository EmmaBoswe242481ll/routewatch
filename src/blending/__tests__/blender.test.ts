import { blendChange, blendChanges, formatBlendText } from '../blender';
import { BlendConfig } from '../types';
import { RouteChange } from '../../diff/types';

function makeChange(overrides: Partial<RouteChange> = {}): RouteChange {
  return {
    path: '/api/users',
    method: 'GET',
    changeType: 'added',
    before: null,
    after: { path: '/api/users', method: 'GET', params: [] },
    ...overrides,
  };
}

const baseConfig: BlendConfig = {
  rules: [
    { pattern: '/api/admin/*', weight: 2.0, strategy: 'override' },
    { pattern: '/api/users*', weight: 1.5, strategy: 'merge' },
  ],
  defaultWeight: 1.0,
  defaultStrategy: 'average',
};

describe('blendChange', () => {
  it('applies matching rule weight and strategy', () => {
    const change = makeChange({ path: '/api/users/profile' });
    const result = blendChange(change, baseConfig);
    expect(result.weight).toBe(1.5);
    expect(result.strategy).toBe('merge');
    expect(result.sources).toContain('/api/users*');
  });

  it('uses default weight/strategy when no rule matches', () => {
    const change = makeChange({ path: '/health' });
    const result = blendChange(change, baseConfig);
    expect(result.weight).toBe(1.0);
    expect(result.strategy).toBe('average');
  });

  it('doubles blended score for removed changes', () => {
    const change = makeChange({ path: '/health', changeType: 'removed' });
    const result = blendChange(change, baseConfig);
    expect(result.blendedScore).toBeCloseTo(2.0);
  });

  it('applies last matching rule when multiple match', () => {
    const change = makeChange({ path: '/api/admin/dashboard' });
    const result = blendChange(change, baseConfig);
    expect(result.strategy).toBe('override');
    expect(result.weight).toBe(2.0);
  });
});

describe('blendChanges', () => {
  it('returns blend result with strategy counts', () => {
    const changes = [
      makeChange({ path: '/api/users/list' }),
      makeChange({ path: '/api/admin/settings' }),
      makeChange({ path: '/health' }),
    ];
    const result = blendChanges(changes, baseConfig);
    expect(result.totalBlended).toBe(3);
    expect(result.strategyCounts['merge']).toBe(1);
    expect(result.strategyCounts['override']).toBe(1);
    expect(result.strategyCounts['average']).toBe(1);
  });

  it('returns empty result for empty input', () => {
    const result = blendChanges([], baseConfig);
    expect(result.totalBlended).toBe(0);
    expect(result.changes).toHaveLength(0);
  });
});

describe('formatBlendText', () => {
  it('returns no-changes message for empty result', () => {
    const result = blendChanges([], baseConfig);
    expect(formatBlendText(result)).toBe('No changes blended.');
  });

  it('includes strategy and score in output', () => {
    const changes = [makeChange({ path: '/api/users/list', method: 'POST' })];
    const result = blendChanges(changes, baseConfig);
    const text = formatBlendText(result);
    expect(text).toContain('MERGE');
    expect(text).toContain('POST');
    expect(text).toContain('/api/users/list');
  });
});
