export interface LintOptions {
  rules?: string[];
  failOnError?: boolean;
}

export interface LintSummary {
  total: number;
  passed: number;
  failed: number;
  errorsByRule: Record<string, number>;
}

export function buildLintSummary(results: Array<{ ruleId: string }>, total: number): LintSummary {
  const errorsByRule: Record<string, number> = {};
  for (const r of results) {
    errorsByRule[r.ruleId] = (errorsByRule[r.ruleId] ?? 0) + 1;
  }
  return {
    total,
    passed: total - results.length,
    failed: results.length,
    errorsByRule,
  };
}
