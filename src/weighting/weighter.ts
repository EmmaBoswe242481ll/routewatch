import { RouteChange } from '../diff/types';

export interface WeightRule {
  pattern: string;
  method?: string;
  weight: number;
}

export interface WeightedChange {
  change: RouteChange;
  weight: number;
}

export interface WeightConfig {
  rules: WeightRule[];
  defaultWeight?: number;
}

function toRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

export function weightChange(change: RouteChange, config: WeightConfig): WeightedChange {
  const defaultWeight = config.defaultWeight ?? 1;
  let weight = defaultWeight;

  for (const rule of config.rules) {
    const re = toRegExp(rule.pattern);
    const pathMatch = re.test(change.path);
    const methodMatch = rule.method ? rule.method.toUpperCase() === change.method?.toUpperCase() : true;
    if (pathMatch && methodMatch) {
      weight = rule.weight;
      break;
    }
  }

  return { change, weight };
}

export function weightChanges(changes: RouteChange[], config: WeightConfig): WeightedChange[] {
  return changes.map(c => weightChange(c, config));
}

export function sortByWeight(weighted: WeightedChange[]): WeightedChange[] {
  return [...weighted].sort((a, b) => b.weight - a.weight);
}

export function formatWeightText(weighted: WeightedChange[]): string {
  if (weighted.length === 0) return 'No weighted changes.';
  const lines = weighted.map(w => `[${w.weight}] ${w.change.method ?? '*'} ${w.change.path} (${w.change.type})`);
  return `Weighted Changes (${weighted.length}):\n` + lines.join('\n');
}
