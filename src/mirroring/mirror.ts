import { RouteChange } from '../diff/types';

export interface MirrorRule {
  source: string;
  target: string;
}

export interface MirrorResult {
  original: RouteChange;
  mirrored: RouteChange;
  rule: MirrorRule;
}

export interface MirrorSummary {
  total: number;
  mirrored: number;
  unmatched: number;
}

function applyRule(path: string, rule: MirrorRule): string | null {
  const sourcePattern = rule.source.replace(/\*/g, '(.*)');
  const regex = new RegExp(`^${sourcePattern}$`);
  const match = path.match(regex);
  if (!match) return null;
  let target = rule.target;
  match.slice(1).forEach((capture, i) => {
    target = target.replace(`$${i + 1}`, capture);
  });
  return target;
}

export function mirrorChange(
  change: RouteChange,
  rules: MirrorRule[]
): MirrorResult | null {
  for (const rule of rules) {
    const mirrored = applyRule(change.path, rule);
    if (mirrored !== null) {
      return {
        original: change,
        mirrored: { ...change, path: mirrored },
        rule,
      };
    }
  }
  return null;
}

export function mirrorChanges(
  changes: RouteChange[],
  rules: MirrorRule[]
): MirrorResult[] {
  const results: MirrorResult[] = [];
  for (const change of changes) {
    const result = mirrorChange(change, rules);
    if (result) results.push(result);
  }
  return results;
}

export function buildMirrorSummary(
  changes: RouteChange[],
  results: MirrorResult[]
): MirrorSummary {
  return {
    total: changes.length,
    mirrored: results.length,
    unmatched: changes.length - results.length,
  };
}

export function formatMirrorText(results: MirrorResult[]): string {
  if (results.length === 0) return 'No routes mirrored.';
  const lines = results.map(
    (r) => `  ${r.original.path} [${r.original.method}] -> ${r.mirrored.path}`
  );
  return `Mirrored Routes (${results.length}):\n${lines.join('\n')}`;
}
