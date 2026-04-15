import { RouteChange } from '../diff/types';

export type ValidationLevel = 'error' | 'warn' | 'info';

export interface ValidationRule {
  id: string;
  description: string;
  level: ValidationLevel;
  check: (change: RouteChange) => boolean;
}

export interface ValidationResult {
  ruleId: string;
  description: string;
  level: ValidationLevel;
  change: RouteChange;
}

export interface ValidationReport {
  results: ValidationResult[];
  errors: number;
  warnings: number;
  passed: boolean;
}

const DEFAULT_RULES: ValidationRule[] = [
  {
    id: 'no-breaking-delete',
    description: 'Deleted routes are breaking changes',
    level: 'error',
    check: (change) => change.type === 'removed',
  },
  {
    id: 'no-method-removal',
    description: 'Removed HTTP methods are breaking changes',
    level: 'error',
    check: (change) =>
      change.type === 'modified' &&
      Array.isArray(change.methodChanges) &&
      change.methodChanges.some((m) => m.type === 'removed'),
  },
  {
    id: 'warn-param-rename',
    description: 'Renamed path parameters may break consumers',
    level: 'warn',
    check: (change) =>
      change.type === 'modified' &&
      Array.isArray(change.paramChanges) &&
      change.paramChanges.some((p) => p.type === 'renamed'),
  },
  {
    id: 'warn-new-required-param',
    description: 'New required path parameters may break consumers',
    level: 'warn',
    check: (change) =>
      change.type === 'modified' &&
      Array.isArray(change.paramChanges) &&
      change.paramChanges.some((p) => p.type === 'added'),
  },
];

export function validateChanges(
  changes: RouteChange[],
  rules: ValidationRule[] = DEFAULT_RULES
): ValidationReport {
  const results: ValidationResult[] = [];

  for (const change of changes) {
    for (const rule of rules) {
      if (rule.check(change)) {
        results.push({
          ruleId: rule.id,
          description: rule.description,
          level: rule.level,
          change,
        });
      }
    }
  }

  const errors = results.filter((r) => r.level === 'error').length;
  const warnings = results.filter((r) => r.level === 'warn').length;

  return {
    results,
    errors,
    warnings,
    passed: errors === 0,
  };
}

export function formatValidationText(report: ValidationReport): string {
  if (report.results.length === 0) {
    return 'Validation passed: no issues found.';
  }

  const lines: string[] = [
    `Validation ${report.passed ? 'passed' : 'failed'}: ${report.errors} error(s), ${report.warnings} warning(s)`,
    '',
  ];

  for (const result of report.results) {
    const prefix = result.level === 'error' ? '✖' : '⚠';
    const route = result.change.route ?? result.change.path ?? 'unknown';
    lines.push(`  ${prefix} [${result.ruleId}] ${result.description}`);
    lines.push(`    Route: ${route}`);
  }

  return lines.join('\n');
}
