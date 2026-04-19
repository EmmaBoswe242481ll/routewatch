import { weightChange, weightChanges, sortByWeight, formatWeightText, WeightConfig } from '../weighter';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, method = 'GET', type: RouteChange['type'] = 'added'): RouteChange {
  return { path, method, type } as RouteChange;
}

const config: WeightConfig = {
  defaultWeight: 1,
  rules: [
    { pattern: '/api/admin/*', weight: 10 },
    { pattern: '/api/*', method: 'DELETE', weight: 5 },
    { pattern: '/health', weight: 0 },
  ],
};

describe('weightChange', () => {
  it('applies matching rule weight', () => {
    const result = weightChange(makeChange('/api/admin/users'), config);
    expect(result.weight).toBe(10);
  });

  it('applies method-specific rule', () => {
    const result = weightChange(makeChange('/api/orders', 'DELETE'), config);
    expect(result.weight).toBe(5);
  });

  it('uses default weight when no rule matches', () => {
    const result = weightChange(makeChange('/public/page'), config);
    expect(result.weight).toBe(1);
  });

  it('assigns zero weight for health route', () => {
    const result = weightChange(makeChange('/health'), config);
    expect(result.weight).toBe(0);
  });

  it('does not apply method rule when method does not match', () => {
    const result = weightChange(makeChange('/api/orders', 'GET'), config);
    expect(result.weight).toBe(1);
  });
});

describe('weightChanges', () => {
  it('weights all changes', () => {
    const changes = [makeChange('/api/admin/x'), makeChange('/health'), makeChange('/other')];
    const results = weightChanges(changes, config);
    expect(results).toHaveLength(3);
    expect(results[0].weight).toBe(10);
    expect(results[1].weight).toBe(0);
    expect(results[2].weight).toBe(1);
  });
});

describe('sortByWeight', () => {
  it('sorts descending by weight', () => {
    const weighted = weightChanges([makeChange('/health'), makeChange('/api/admin/x'), makeChange('/other')], config);
    const sorted = sortByWeight(weighted);
    expect(sorted[0].weight).toBe(10);
    expect(sorted[sorted.length - 1].weight).toBe(0);
  });
});

describe('formatWeightText', () => {
  it('returns message for empty array', () => {
    expect(formatWeightText([])).toBe('No weighted changes.');
  });

  it('formats weighted changes', () => {
    const weighted = weightChanges([makeChange('/api/admin/x')], config);
    const text = formatWeightText(weighted);
    expect(text).toContain('[10]');
    expect(text).toContain('/api/admin/x');
  });
});
