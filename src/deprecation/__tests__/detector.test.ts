import {
  matchesDeprecationRule,
  detectDeprecations,
  formatDeprecationText,
  DeprecationRule,
} from '../detector';
import { RouteChange } from '../../diff/types';

const rules: DeprecationRule[] = [
  { pattern: '/v1/', reason: 'v1 API is deprecated', since: '2024-01', replacement: '/v2/' },
  { pattern: 'legacy', reason: 'Legacy endpoints removed' },
];

function makeChange(overrides: Partial<RouteChange> = {}): RouteChange {
  return {
    type: 'removed',
    route: '/api/v1/users',
    method: 'GET',
    commit: 'abc123',
    ...overrides,
  } as RouteChange;
}

describe('matchesDeprecationRule', () => {
  it('matches regex pattern', () => {
    expect(matchesDeprecationRule('/api/v1/users', { pattern: '/v1/' })).toBe(true);
  });

  it('returns false when pattern does not match', () => {
    expect(matchesDeprecationRule('/api/v2/users', { pattern: '/v1/' })).toBe(false);
  });

  it('falls back to string includes for invalid regex', () => {
    expect(matchesDeprecationRule('/api/legacy/foo', { pattern: 'legacy' })).toBe(true);
  });
});

describe('detectDeprecations', () => {
  it('returns empty report when no changes match rules', () => {
    const changes = [makeChange({ route: '/api/v2/users', type: 'added' })];
    const report = detectDeprecations(changes, rules);
    expect(report.total).toBe(0);
    expect(report.deprecated).toHaveLength(0);
    expect(report.removed).toHaveLength(0);
  });

  it('detects removed deprecated routes', () => {
    const changes = [makeChange({ route: '/api/v1/users', type: 'removed' })];
    const report = detectDeprecations(changes, rules);
    expect(report.removed).toHaveLength(1);
    expect(report.removed[0].route).toBe('/api/v1/users');
    expect(report.removed[0].removedInCommit).toBe('abc123');
    expect(report.removed[0].replacement).toBe('/v2/');
  });

  it('detects still-present deprecated routes', () => {
    const changes = [makeChange({ route: '/api/v1/orders', type: 'modified' })];
    const report = detectDeprecations(changes, rules);
    expect(report.deprecated).toHaveLength(1);
    expect(report.deprecated[0].since).toBe('2024-01');
  });

  it('counts total correctly', () => {
    const changes = [
      makeChange({ route: '/api/v1/a', type: 'removed' }),
      makeChange({ route: '/api/legacy/b', type: 'added' }),
    ];
    const report = detectDeprecations(changes, rules);
    expect(report.total).toBe(2);
  });
});

describe('formatDeprecationText', () => {
  it('returns no-issue message when total is 0', () => {
    const text = formatDeprecationText({ deprecated: [], removed: [], total: 0 });
    expect(text).toContain('No deprecated');
  });

  it('includes deprecated and removed sections', () => {
    const report = {
      deprecated: [{ route: '/v1/foo', method: 'GET', reason: 'old', since: '2023-01', replacement: '/v2/foo' }],
      removed: [{ route: '/v1/bar', method: 'POST', reason: 'gone', removedInCommit: 'def456' }],
      total: 2,
    };
    const text = formatDeprecationText(report);
    expect(text).toContain('Deprecated (1)');
    expect(text).toContain('Removed (1)');
    expect(text).toContain('/v1/foo');
    expect(text).toContain('def456');
    expect(text).toContain('/v2/foo');
  });
});
