import { RouteChange } from '../diff/types';

export interface TransposeRule {
  fromMethod: string;
  toMethod: string;
  pathPattern?: string;
}

export interface TransposeResult {
  original: RouteChange;
  transposed: RouteChange;
  rule: TransposeRule;
}

export interface TransposeSummary {
  total: number;
  transposed: number;
  unchanged: number;
}

function toRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

export function transposeChange(
  change: RouteChange,
  rules: TransposeRule[]
): TransposeResult | null {
  for (const rule of rules) {
    const methodMatches = change.method.toUpperCase() === rule.fromMethod.toUpperCase();
    if (!methodMatches) continue;

    if (rule.pathPattern) {
      const re = toRegExp(rule.pathPattern);
      if (!re.test(change.path)) continue;
    }

    const transposed: RouteChange = {
      ...change,
      method: rule.toMethod.toUpperCase(),
    };

    return { original: change, transposed, rule };
  }

  return null;
}

export function transposeChanges(
  changes: RouteChange[],
  rules: TransposeRule[]
): { changes: RouteChange[]; results: TransposeResult[] } {
  const results: TransposeResult[] = [];
  const output: RouteChange[] = [];

  for (const change of changes) {
    const result = transposeChange(change, rules);
    if (result) {
      results.push(result);
      output.push(result.transposed);
    } else {
      output.push(change);
    }
  }

  return { changes: output, results };
}

export function buildTransposeSummary(results: TransposeResult[], total: number): TransposeSummary {
  return {
    total,
    transposed: results.length,
    unchanged: total - results.length,
  };
}

export function formatTransposeText(summary: TransposeSummary): string {
  return [
    `Transpose summary:`,
    `  Total   : ${summary.total}`,
    `  Transposed: ${summary.transposed}`,
    `  Unchanged : ${summary.unchanged}`,
  ].join('\n');
}
