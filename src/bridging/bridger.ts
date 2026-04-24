/**
 * Bridging module — maps route changes across different framework conventions
 * (e.g., Next.js file-based routes ↔ Express path-based routes) so that
 * semantically equivalent routes can be correlated in diff reports.
 */

import type { RouteChange } from '../diff/types';

export interface BridgeRule {
  /** Source framework pattern (e.g., "nextjs" or "express") */
  from: string;
  /** Target framework pattern */
  to: string;
  /** Regex or glob to match the source path */
  pattern: string;
  /** Replacement string (supports capture groups) */
  replacement: string;
}

export interface BridgeResult {
  change: RouteChange;
  originalPath: string;
  bridgedPath: string;
  rule: BridgeRule;
}

export interface BridgeSummary {
  total: number;
  bridged: number;
  unmatched: number;
}

/** Compile a pattern string into a RegExp. */
function toRegExp(pattern: string): RegExp {
  try {
    return new RegExp(pattern);
  } catch {
    // Treat as a literal string if the pattern is invalid
    return new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  }
}

/**
 * Apply a single bridge rule to a path, returning the transformed path
 * or null if the rule does not match.
 */
export function applyRule(path: string, rule: BridgeRule): string | null {
  const re = toRegExp(rule.pattern);
  if (!re.test(path)) return null;
  return path.replace(re, rule.replacement);
}

/**
 * Bridge a single RouteChange by finding the first matching rule and
 * transforming its path accordingly.
 */
export function bridgeChange(
  change: RouteChange,
  rules: BridgeRule[]
): BridgeResult | null {
  for (const rule of rules) {
    const bridgedPath = applyRule(change.path, rule);
    if (bridgedPath !== null) {
      return {
        change: { ...change, path: bridgedPath },
        originalPath: change.path,
        bridgedPath,
        rule,
      };
    }
  }
  return null;
}

/**
 * Bridge an array of RouteChanges, applying matching rules where possible.
 * Changes without a matching rule are returned as-is.
 */
export function bridgeChanges(
  changes: RouteChange[],
  rules: BridgeRule[]
): { results: Array<BridgeResult | null>; bridged: RouteChange[] } {
  const results = changes.map((c) => bridgeChange(c, rules));
  const bridged = results.map((r, i) =>
    r !== null ? r.change : changes[i]
  );
  return { results, bridged };
}

/** Build a summary of how many changes were bridged. */
export function buildBridgeSummary(
  results: Array<BridgeResult | null>
): BridgeSummary {
  const bridged = results.filter((r) => r !== null).length;
  return {
    total: results.length,
    bridged,
    unmatched: results.length - bridged,
  };
}

/** Format a human-readable summary of bridging results. */
export function formatBridgeText(
  results: Array<BridgeResult | null>,
  changes: RouteChange[]
): string {
  const summary = buildBridgeSummary(results);
  const lines: string[] = [
    `Bridge summary: ${summary.bridged}/${summary.total} routes bridged (${summary.unmatched} unmatched)`,
  ];
  results.forEach((r, i) => {
    if (r !== null) {
      lines.push(
        `  [${changes[i].method}] ${r.originalPath} → ${r.bridgedPath} (rule: ${r.rule.from}→${r.rule.to})`
      );
    }
  });
  return lines.join('\n');
}
