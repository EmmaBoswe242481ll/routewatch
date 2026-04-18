import { labelChange, labelChanges, groupByLabel, formatLabelText } from '../labeler';
import { buildLabelSummary } from '../types';
import { RouteChange } from '../../diff/types';

function makeChange(route: string, method = 'GET', type: RouteChange['type'] = 'added'): RouteChange {
  return { route, method, type } as any;
}

const rules = [
  { pattern: '/api/users*', label: 'users' },
  { pattern: '/api/admin*', label: 'admin', methods: ['POST', 'DELETE'] },
  { pattern: '/health', label: 'infra' },
];

describe('labelChange', () => {
  it('applies matching label', () => {
    const result = labelChange(makeChange('/api/users/123'), rules);
    expect(result.labels).toContain('users');
  });

  it('returns empty labels when no match', () => {
    const result = labelChange(makeChange('/unknown'), rules);
    expect(result.labels).toEqual([]);
  });

  it('respects method filter', () => {
    const postMatch = labelChange(makeChange('/api/admin/settings', 'POST'), rules);
    expect(postMatch.labels).toContain('admin');
    const getNoMatch = labelChange(makeChange('/api/admin/settings', 'GET'), rules);
    expect(getNoMatch.labels).not.toContain('admin');
  });

  it('can apply multiple labels', () => {
    const extraRules = [...rules, { pattern: '/api/users*', label: 'v1' }];
    const result = labelChange(makeChange('/api/users'), extraRules);
    expect(result.labels).toContain('users');
    expect(result.labels).toContain('v1');
  });
});

describe('labelChanges', () => {
  it('labels all changes', () => {
    const changes = [makeChange('/api/users'), makeChange('/health'), makeChange('/other')];
    const results = labelChanges(changes, { rules });
    expect(results[0].labels).toContain('users');
    expect(results[1].labels).toContain('infra');
    expect(results[2].labels).toEqual([]);
  });
});

describe('groupByLabel', () => {
  it('groups into unlabeled when no labels', () => {
    const labeled = labelChanges([makeChange('/unknown')], { rules });
    const grouped = groupByLabel(labeled);
    expect(grouped['unlabeled']).toHaveLength(1);
  });

  it('groups correctly by label', () => {
    const labeled = labelChanges([makeChange('/api/users'), makeChange('/health')], { rules });
    const grouped = groupByLabel(labeled);
    expect(grouped['users']).toHaveLength(1);
    expect(grouped['infra']).toHaveLength(1);
  });
});

describe('formatLabelText', () => {
  it('returns formatted string', () => {
    const labeled = labelChanges([makeChange('/api/users')], { rules });
    const text = formatLabelText(labeled);
    expect(text).toContain('Route Labels:');
    expect(text).toContain('[users]');
  });
});

describe('buildLabelSummary', () => {
  it('counts labels and unlabeled', () => {
    const labeled = labelChanges([makeChange('/api/users'), makeChange('/unknown')], { rules });
    const grouped = groupByLabel(labeled);
    const summary = buildLabelSummary(grouped);
    expect(summary.labelCounts['users']).toBe(1);
    expect(summary.unlabeledCount).toBe(1);
    expect(summary.totalLabels).toBe(1);
  });
});
