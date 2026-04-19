import type { EncodedChange } from './encoder';

export interface EncodingSummary {
  total: number;
  format: string;
  fields: string[];
}

export function buildEncodingSummary(
  results: EncodedChange[],
  format: string,
  fields: string[]
): EncodingSummary {
  return {
    total: results.length,
    format,
    fields,
  };
}
