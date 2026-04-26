import {
  fenceChange,
  fenceChanges,
  buildFenceSummary,
  formatFenceText,
  FenceRule,
} from '../fencer';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, method = 'GET'): RouteChange {
  return { type: 'modified', route: path, path, method } as unknown as RouteChange;
}

const rules: FenceRule[] = [
  { pattern: '/admin/*', label: 'admin', allowedMethods: ['GET'] },
  { pattern: '/api/*', label: 'api' },
];

describe('fenceChange', () => {
  it('returns allowed true when no rule matches', () => {
    const result = fenceChange(makeChange('/public/page'), rules);
    expect(result.label).toBe('default');
    expect(result.allowed).toBe(true);
  });

  it('matches a pattern and marks allowed', () => {
    const result = fenceChange(makeChange('/api/users'), rules);
    expect(result.label).toBe('api');
    expect(result.allowed).toBe(true);
  });

  it('blocks a disallowed method under a fenced pattern', () => {
    const result = fenceChange(makeChange('/admin/settings', 'DELETE'), rules);
    expect(result.label).toBe('admin');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('DELETE');
  });

  it('allows an explicitly permitted method', () => {
    const result = fenceChange(makeChange('/admin/settings', 'GET'), rules);
    expect(result.label).toBe('admin');
    expect(result.allowed).toBe(true);
  });
});

describe('fenceChanges', () => {
  it('processes multiple changes', () => {
    const changes = [
      makeChange('/api/orders'),
      makeChange('/admin/users', 'POST'),
      makeChange('/health'),
    ];
    const results = fenceChanges(changes, rules);
    expect(results).toHaveLength(3);
    expect(results[0].label).toBe('api');
    expect(results[1].allowed).toBe(false);
    expect(results[2].label).toBe('default');
  });
});

describe('buildFenceSummary', () => {
  it('aggregates totals correctly', () => {
    const results = fenceChanges(
      [makeChange('/api/a'), makeChange('/admin/b', 'DELETE'), makeChange('/x')],
      rules
    );
    const summary = buildFenceSummary(results);
    expect(summary.total).toBe(3);
    expect(summary.allowed).toBe(2);
    expect(summary.blocked).toBe(1);
    expect(summary.byLabel['api']).toBe(1);
    expect(summary.byLabel['admin']).toBe(1);
    expect(summary.byLabel['default']).toBe(1);
  });
});

describe('formatFenceText', () => {
  it('returns a formatted string', () => {
    const summary = { total: 5, allowed: 4, blocked: 1, byLabel: { api: 3, admin: 2 } };
    const text = formatFenceText(summary);
    expect(text).toContain('5 changes evaluated');
    expect(text).toContain('Allowed : 4');
    expect(text).toContain('Blocked : 1');
    expect(text).toContain('[api] 3');
  });
});
