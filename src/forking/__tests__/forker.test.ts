import {
  forkChange,
  forkChanges,
  flattenForks,
  buildForkSummary,
  formatForkText,
  ForkRule,
} from '../forker';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, type: RouteChange['type'] = 'modified'): RouteChange {
  return {
    type,
    before: { path, method: 'GET', params: [] },
    after: { path, method: 'GET', params: [] },
  } as unknown as RouteChange;
}

const rules: ForkRule[] = [
  { match: '^/api/v1', targets: ['/api/v2', '/api/v3'] },
  { match: /^\/health/, targets: ['/status'] },
];

describe('forkChange', () => {
  it('forks a matching change to all targets', () => {
    const change = makeChange('/api/v1/users');
    const result = forkChange(change, rules);
    expect(result.forks).toHaveLength(2);
    expect(result.forks[0].after?.path).toBe('/api/v2');
    expect(result.forks[1].after?.path).toBe('/api/v3');
    expect(result.targetCount).toBe(2);
  });

  it('returns empty forks for non-matching change', () => {
    const change = makeChange('/internal/metrics');
    const result = forkChange(change, rules);
    expect(result.forks).toHaveLength(0);
    expect(result.targetCount).toBe(0);
  });

  it('matches regex rules', () => {
    const change = makeChange('/health/check');
    const result = forkChange(change, rules);
    expect(result.forks).toHaveLength(1);
    expect(result.forks[0].after?.path).toBe('/status');
  });

  it('preserves original change reference', () => {
    const change = makeChange('/api/v1/orders');
    const result = forkChange(change, rules);
    expect(result.original).toBe(change);
  });
});

describe('forkChanges', () => {
  it('processes multiple changes', () => {
    const changes = [makeChange('/api/v1/users'), makeChange('/other')];
    const results = forkChanges(changes, rules);
    expect(results).toHaveLength(2);
    expect(results[0].forks).toHaveLength(2);
    expect(results[1].forks).toHaveLength(0);
  });
});

describe('flattenForks', () => {
  it('returns forked changes when forks exist', () => {
    const results = forkChanges([makeChange('/api/v1/users')], rules);
    const flat = flattenForks(results);
    expect(flat).toHaveLength(2);
  });

  it('returns original when no forks', () => {
    const results = forkChanges([makeChange('/other')], rules);
    const flat = flattenForks(results);
    expect(flat).toHaveLength(1);
  });
});

describe('buildForkSummary', () => {
  it('computes correct summary', () => {
    const results = forkChanges(
      [makeChange('/api/v1/a'), makeChange('/other'), makeChange('/api/v1/b')],
      rules
    );
    const summary = buildForkSummary(results);
    expect(summary.total).toBe(3);
    expect(summary.forked).toBe(2);
    expect(summary.unforked).toBe(1);
    expect(summary.totalForks).toBe(4);
  });
});

describe('formatForkText', () => {
  it('formats summary as readable text', () => {
    const text = formatForkText({ total: 5, forked: 3, unforked: 2, totalForks: 7 });
    expect(text).toContain('Forking Summary');
    expect(text).toContain('Total changes : 5');
    expect(text).toContain('Forked        : 3');
    expect(text).toContain('Total forks   : 7');
  });
});
