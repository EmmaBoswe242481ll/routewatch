import { RouteChange } from '../diff/types';

export interface EnrichmentMeta {
  deprecated?: boolean;
  internal?: boolean;
  owner?: string;
  description?: string;
  tags?: string[];
  addedAt?: string;
}

export interface EnrichedChange {
  change: RouteChange;
  meta: EnrichmentMeta;
}

export interface EnrichmentRule {
  pattern: string | RegExp;
  meta: EnrichmentMeta;
}

function toRegExp(pattern: string | RegExp): RegExp {
  if (pattern instanceof RegExp) return pattern;
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

export function enrichChange(
  change: RouteChange,
  rules: EnrichmentRule[]
): EnrichedChange {
  const meta: EnrichmentMeta = {};
  const routePath = change.route.path;

  for (const rule of rules) {
    const regex = toRegExp(rule.pattern);
    if (regex.test(routePath)) {
      Object.assign(meta, rule.meta);
      if (rule.meta.tags && meta.tags) {
        meta.tags = Array.from(new Set([...meta.tags, ...rule.meta.tags]));
      }
    }
  }

  return { change, meta };
}

export function enrichChanges(
  changes: RouteChange[],
  rules: EnrichmentRule[]
): EnrichedChange[] {
  return changes.map((change) => enrichChange(change, rules));
}

export function formatEnrichmentText(enriched: EnrichedChange[]): string {
  if (enriched.length === 0) return 'No enriched changes.';

  const lines: string[] = ['Enriched Changes:', ''];

  for (const { change, meta } of enriched) {
    lines.push(`  ${change.type.toUpperCase()} ${change.route.method} ${change.route.path}`);
    if (meta.owner) lines.push(`    Owner: ${meta.owner}`);
    if (meta.description) lines.push(`    Description: ${meta.description}`);
    if (meta.deprecated) lines.push(`    Deprecated: yes`);
    if (meta.internal) lines.push(`    Internal: yes`);
    if (meta.tags?.length) lines.push(`    Tags: ${meta.tags.join(', ')}`);
    if (meta.addedAt) lines.push(`    Added at: ${meta.addedAt}`);
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}
