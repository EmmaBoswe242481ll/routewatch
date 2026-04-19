import { RouteChange } from '../diff/types';

export interface ProjectionField {
  field: 'path' | 'method' | 'type' | 'params' | 'file';
  alias?: string;
}

export interface ProjectionConfig {
  fields: ProjectionField[];
  includeNulls?: boolean;
}

export interface ProjectedChange {
  [key: string]: unknown;
}

export function projectChange(
  change: RouteChange,
  config: ProjectionConfig
): ProjectedChange {
  const result: ProjectedChange = {};
  for (const { field, alias } of config.fields) {
    const key = alias ?? field;
    const value = (change as unknown as Record<string, unknown>)[field];
    if (value === undefined || value === null) {
      if (config.includeNulls) result[key] = null;
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function projectChanges(
  changes: RouteChange[],
  config: ProjectionConfig
): ProjectedChange[] {
  return changes.map(c => projectChange(c, config));
}

export function formatProjectionText(
  projected: ProjectedChange[],
  config: ProjectionConfig
): string {
  const fields = config.fields.map(f => f.alias ?? f.field);
  const header = fields.join('\t');
  const rows = projected.map(p =>
    fields.map(f => (p[f] !== undefined && p[f] !== null ? String(p[f]) : '')).join('\t')
  );
  return [header, ...rows].join('\n');
}
