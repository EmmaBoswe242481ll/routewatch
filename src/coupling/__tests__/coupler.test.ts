import { findCoupledChanges, formatCouplingText, CouplingRule } from '../coupler';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, method = 'GET', type: RouteChange['type'] = 'modified'): RouteChange {
  return { path, method, type, before: undefined, after: undefined } as unknown as RouteChange;
}

describe('findCoupledChanges', () => {
  const rules: CouplingRule[] = [
    { source: '/api/users*', target: '/api/auth*', reason: 'Auth depends on users' },
  ];

  it('returns empty pairs when no rules match', () => {
    const changes = [makeChange('/api/posts'), makeChange('/api/comments')];
    const result = findCoupledChanges(changes, rules);
    expect(result.pairs).toHaveLength(0);
    expect(result.uncoupled).toHaveLength(2);
    expect(result.totalCoupled).toBe(0);
  });

  it('identifies coupled pairs based on rules', () => {
    const changes = [
      makeChange('/api/users'),
      makeChange('/api/auth/login'),
      makeChange('/api/posts'),
    ];
    const result = findCoupledChanges(changes, rules);
    expect(result.pairs).toHaveLength(1);
    expect(result.pairs[0].source.path).toBe('/api/users');
    expect(result.pairs[0].target.path).toBe('/api/auth/login');
    expect(result.pairs[0].reason).toBe('Auth depends on users');
    expect(result.totalCoupled).toBe(2);
    expect(result.uncoupled).toHaveLength(1);
    expect(result.uncoupled[0].path).toBe('/api/posts');
  });

  it('does not couple a change with itself', () => {
    const selfRules: CouplingRule[] = [{ source: '/api/*', target: '/api/*' }];
    const changes = [makeChange('/api/users')];
    const result = findCoupledChanges(changes, selfRules);
    expect(result.pairs).toHaveLength(0);
  });

  it('uses default reason when none provided', () => {
    const noReasonRules: CouplingRule[] = [{ source: '/api/users*', target: '/api/auth*' }];
    const changes = [makeChange('/api/users'), makeChange('/api/auth/token')];
    const result = findCoupledChanges(changes, noReasonRules);
    expect(result.pairs[0].reason).toContain('Coupled via rule');
  });

  it('handles multiple rules producing multiple pairs', () => {
    const multiRules: CouplingRule[] = [
      { source: '/api/users*', target: '/api/auth*' },
      { source: '/api/orders*', target: '/api/payments*' },
    ];
    const changes = [
      makeChange('/api/users'),
      makeChange('/api/auth/login'),
      makeChange('/api/orders'),
      makeChange('/api/payments/charge'),
    ];
    const result = findCoupledChanges(changes, multiRules);
    expect(result.pairs).toHaveLength(2);
    expect(result.totalCoupled).toBe(4);
    expect(result.uncoupled).toHaveLength(0);
  });
});

describe('formatCouplingText', () => {
  it('formats result with pairs', () => {
    const changes = [makeChange('/api/users'), makeChange('/api/auth/login')];
    const rules: CouplingRule[] = [{ source: '/api/users*', target: '/api/auth*', reason: 'linked' }];
    const result = findCoupledChanges(changes, rules);
    const text = formatCouplingText(result);
    expect(text).toContain('Coupling Analysis');
    expect(text).toContain('/api/users');
    expect(text).toContain('/api/auth/login');
    expect(text).toContain('linked');
  });

  it('formats result with no pairs', () => {
    const result = { pairs: [], uncoupled: [], totalCoupled: 0 };
    const text = formatCouplingText(result);
    expect(text).toContain('0 pair(s)');
  });
});
