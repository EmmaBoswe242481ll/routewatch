import {
  validateChanges,
  formatValidationText,
  ValidationRule,
} from '../validator';
import { RouteChange } from '../../diff/types';

function makeChange(overrides: Partial<RouteChange> = {}): RouteChange {
  return {
    type: 'added',
    path: '/api/test',
    route: '/api/test',
    method: 'GET',
    ...overrides,
  } as RouteChange;
}

describe('validateChanges', () => {
  it('returns passed=true and empty results when no changes', () => {
    const report = validateChanges([]);
    expect(report.passed).toBe(true);
    expect(report.results).toHaveLength(0);
    expect(report.errors).toBe(0);
    expect(report.warnings).toBe(0);
  });

  it('flags removed routes as errors', () => {
    const change = makeChange({ type: 'removed' });
    const report = validateChanges([change]);
    expect(report.passed).toBe(false);
    expect(report.errors).toBeGreaterThan(0);
    const ids = report.results.map((r) => r.ruleId);
    expect(ids).toContain('no-breaking-delete');
  });

  it('flags removed methods as errors', () => {
    const change = makeChange({
      type: 'modified',
      methodChanges: [{ type: 'removed', method: 'DELETE' }],
    } as any);
    const report = validateChanges([change]);
    expect(report.passed).toBe(false);
    const ids = report.results.map((r) => r.ruleId);
    expect(ids).toContain('no-method-removal');
  });

  it('warns on renamed path parameters', () => {
    const change = makeChange({
      type: 'modified',
      paramChanges: [{ type: 'renamed', from: 'id', to: 'userId' }],
    } as any);
    const report = validateChanges([change]);
    expect(report.passed).toBe(true);
    expect(report.warnings).toBeGreaterThan(0);
    const ids = report.results.map((r) => r.ruleId);
    expect(ids).toContain('warn-param-rename');
  });

  it('warns on added path parameters', () => {
    const change = makeChange({
      type: 'modified',
      paramChanges: [{ type: 'added', param: 'version' }],
    } as any);
    const report = validateChanges([change]);
    expect(report.warnings).toBeGreaterThan(0);
    const ids = report.results.map((r) => r.ruleId);
    expect(ids).toContain('warn-new-required-param');
  });

  it('does not flag added routes', () => {
    const change = makeChange({ type: 'added' });
    const report = validateChanges([change]);
    expect(report.passed).toBe(true);
    expect(report.results).toHaveLength(0);
  });

  it('respects custom rules', () => {
    const customRule: ValidationRule = {
      id: 'no-get',
      description: 'GET routes are not allowed',
      level: 'error',
      check: (c) => c.method === 'GET',
    };
    const change = makeChange({ type: 'added', method: 'GET' });
    const report = validateChanges([change], [customRule]);
    expect(report.passed).toBe(false);
    expect(report.results[0].ruleId).toBe('no-get');
  });
});

describe('formatValidationText', () => {
  it('returns success message when no results', () => {
    const report = { results: [], errors: 0, warnings: 0, passed: true };
    expect(formatValidationText(report)).toContain('passed');
  });

  it('includes rule id and route in output', () => {
    const change = makeChange({ type: 'removed', route: '/api/users' });
    const report = validateChanges([change]);
    const text = formatValidationText(report);
    expect(text).toContain('no-breaking-delete');
    expect(text).toContain('/api/users');
    expect(text).toContain('failed');
  });
});
