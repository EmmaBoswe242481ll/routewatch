import { RouteChange } from '../diff/types';
import { BlendConfig, BlendedChange, BlendResult } from './types';

function toRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

export function blendChange(
  change: RouteChange,
  config: BlendConfig
): BlendedChange {
  const defaultWeight = config.defaultWeight ?? 1.0;
  const defaultStrategy = config.defaultStrategy ?? 'merge';

  let weight = defaultWeight;
  let strategy: BlendedChange['strategy'] = defaultStrategy;
  const sources: string[] = ['default'];

  for (const rule of config.rules) {
    const re = toRegExp(rule.pattern);
    if (re.test(change.path)) {
      weight = rule.weight;
      strategy = rule.strategy;
      sources.push(rule.pattern);
    }
  }

  const blendedScore = weight * (change.changeType === 'removed' ? 2.0 : 1.0);

  return {
    path: change.path,
    method: change.method,
    changeType: change.changeType,
    weight,
    strategy,
    sources,
    blendedScore,
  };
}

export function blendChanges(
  changes: RouteChange[],
  config: BlendConfig
): BlendResult {
  const blended = changes.map(c => blendChange(c, config));
  const strategyCounts: Record<string, number> = {};
  for (const b of blended) {
    strategyCounts[b.strategy] = (strategyCounts[b.strategy] ?? 0) + 1;
  }
  return {
    changes: blended,
    totalBlended: blended.length,
    strategyCounts,
  };
}

export function formatBlendText(result: BlendResult): string {
  if (result.changes.length === 0) return 'No changes blended.';
  const lines = result.changes.map(
    b =>
      `[${b.strategy.toUpperCase()}] ${b.method} ${b.path} (score: ${b.blendedScore.toFixed(2)})`
  );
  lines.push(`\nTotal: ${result.totalBlended} blended change(s).`);
  return lines.join('\n');
}
