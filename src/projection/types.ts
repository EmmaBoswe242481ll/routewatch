import { ProjectedChange } from './projector';

export interface ProjectionResult {
  total: number;
  fields: string[];
  rows: ProjectedChange[];
}

export function buildProjectionResult(
  fields: string[],
  rows: ProjectedChange[]
): ProjectionResult {
  return { total: rows.length, fields, rows };
}

export function projectionsToTable(result: ProjectionResult): string[][] {
  return result.rows.map(row =>
    result.fields.map(f => (row[f] != null ? String(row[f]) : ''))
  );
}
