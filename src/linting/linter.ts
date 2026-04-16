import type { RouteChange } from '../diff/types';

export interface LintRule {
  id: string;
  description: string;
  check: (change: RouteChange) => string | null;
}

export interface LintResult {
  changeKey: string;
  ruleId: string;
  description: string;
  message: string;
}

export interface LintReport {
  results: LintResult[];
  passCount: number;
  failCount: number;
}

const builtinRules: LintRule[] = [
  {
    id: 'no-uppercase-path',
    description: 'Route paths should be lowercase',
    check: (c) => /[A-Z]/.test(c.path) ? `Path "${c.path}" contains uppercase letters` : null,
  },
  {
    id: 'no-trailing-slash',
    description: 'Route paths should not have a trailing slash',
    check: (c) => c.path.length > 1 && c.path.endsWith('/') ? `Path "${c.path}" has a trailing slash` : null,
  },
  {
    id: 'method-uppercase',
    description: 'HTTP methods should be uppercase',
    check: (c) => c.method !== c.method.toUpperCase() ? `Method "${c.method}" should be uppercase` : null,
  },
  {
    id: 'no-double-slash',
    description: 'Route paths should not contain double slashes',
    check: (c) => c.path.includes('//') ? `Path "${c.path}" contains double slashes` : null,
  },
];

export function lintChanges(
  changes: RouteChange[],
  rules: LintRule[] = builtinRules
): LintReport {
  const results: LintResult[] = [];

  for (const change of changes) {
    const key = `${change.method}:${change.path}`;
    for (const rule of rules) {
      const message = rule.check(change);
      if (message) {
        results.push({ changeKey: key, ruleId: rule.id, description: rule.description, message });
      }
    }
  }

  const totalChecks = changes.length * rules.length;
  return {
    results,
    passCount: totalChecks - results.length,
    failCount: results.length,
  };
}

export function formatLintText(report: LintReport): string {
  if (report.failCount === 0) return 'Lint passed: no issues found.';
  const lines = [`Lint failed: ${report.failCount} issue(s) found.`, ''];
  for (const r of report.results) {
    lines.push(`[${r.ruleId}] ${r.changeKey}: ${r.message}`);
  }
  return lines.join('\n');
}
