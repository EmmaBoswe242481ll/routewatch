import { CurationConfig, CurationResult, CuratedChange, CurationRule } from './types';

interface Change {
  path: string;
  method: string;
  changeType: string;
}

function toRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`, 'i');
}

function matchesRule(change: Change, rule: CurationRule): boolean {
  const re = toRegExp(rule.pattern);
  return re.test(change.path) || re.test(`${change.method} ${change.path}`);
}

function findMatchingRule(
  change: Change,
  rules: CurationRule[]
): CurationRule | undefined {
  const sorted = [...rules].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  return sorted.find((rule) => matchesRule(change, rule));
}

export function curateChanges(
  changes: Change[],
  config: CurationConfig
): CurationResult {
  const result: CurationResult = {
    included: [],
    excluded: [],
    promoted: [],
    demoted: [],
    total: changes.length,
  };

  const defaultAction = config.defaultAction ?? 'include';

  for (const change of changes) {
    const rule = findMatchingRule(change, config.rules);
    const action = rule ? rule.action : defaultAction;

    const curated: CuratedChange = {
      ...change,
      action,
      matchedRule: rule,
      reason: rule?.reason,
    };

    if (action === 'include') result.included.push(curated);
    else if (action === 'exclude') result.excluded.push(curated);
    else if (action === 'promote') result.promoted.push(curated);
    else if (action === 'demote') result.demoted.push(curated);
  }

  return result;
}

export function formatCurationText(result: CurationResult): string {
  const lines: string[] = [`Curation Result (${result.total} changes):`];
  if (result.included.length) lines.push(`  Included: ${result.included.length}`);
  if (result.excluded.length) lines.push(`  Excluded: ${result.excluded.length}`);
  if (result.promoted.length) lines.push(`  Promoted: ${result.promoted.length}`);
  if (result.demoted.length) lines.push(`  Demoted: ${result.demoted.length}`);
  return lines.join('\n');
}
