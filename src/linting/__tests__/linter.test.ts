import { lintChanges, formatLintText } from '../linter';
import type { RouteChange } from '../../diff/types';

function makeChange(overrides: Partial<RouteChange> = {}): RouteChange {
  return {
    type: 'added',
    method: 'GET',
    path: '/api/users',
    params: [],
    ...overrides,
  } as RouteChange;
}

describe('lintChanges', () => {
  it('returns no results for clean changes', () => {
    const report = lintChanges([makeChange()]);
    expect(report.failCount).toBe(0);
    expect(report.results).toHaveLength(0);
  });

  it('detects uppercase path', () => {
    const report = lintChanges([makeChange({ path: '/Api/Users' })]);
    const ids = report.results.map((r) => r.ruleId);
    expect(ids).toContain('no-uppercase-path');
  });

  it('detects trailing slash', () => {
    const report = lintChanges([makeChange({ path: '/api/users/' })]);
    const ids = report.results.map((r) => r.ruleId);
    expect(ids).toContain('no-trailing-slash');
  });

  it('detects lowercase method', () => {
    const report = lintChanges([makeChange({ method: 'get' })]);
    const ids = report.results.map((r) => r.ruleId);
    expect(ids).toContain('method-uppercase');
  });

  it('detects double slash', () => {
    const report = lintChanges([makeChange({ path: '/api//users' })]);
    const ids = report.results.map((r) => r.ruleId);
    expect(ids).toContain('no-double-slash');
  });

  it('counts pass and fail correctly', () => {
    const changes = [makeChange(), makeChange({ path: '/Bad/' })];
    const report = lintChanges(changes);
    expect(report.failCount).toBeGreaterThan(0);
    expect(report.passCount + report.failCount).toBe(changes.length * 4);
  });

  it('supports custom rules', () => {
    const rule = { id: 'custom', description: 'test', check: () => 'always fails' };
    const report = lintChanges([makeChange()], [rule]);
    expect(report.failCount).toBe(1);
    expect(report.results[0].ruleId).toBe('custom');
  });
});

describe('formatLintText', () => {
  it('returns pass message when no issues', () => {
    const report = lintChanges([makeChange()]);
    expect(formatLintText(report)).toMatch(/passed/);
  });

  it('returns failure details when issues exist', () => {
    const report = lintChanges([makeChange({ method: 'post' })]);
    const text = formatLintText(report);
    expect(text).toMatch(/failed/);
    expect(text).toMatch('method-uppercase');
  });
});
