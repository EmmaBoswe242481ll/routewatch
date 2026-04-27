/**
 * Types for the pivoting module.
 * Defines structures used when pivoting route changes by a given field.
 */

import type { RouteChange } from '../diff/types';

/** Fields that can be used as pivot keys */
export type PivotField = 'method' | 'changeType' | 'path' | 'tag';

/** A single pivot bucket containing changes grouped under a pivot key */
export interface PivotBucket {
  /** The pivot key value (e.g. "GET", "added") */
  key: string;
  /** Changes belonging to this bucket */
  changes: RouteChange[];
  /** Number of changes in this bucket */
  count: number;
}

/** Result of a pivot operation */
export interface PivotResult {
  /** Field used for pivoting */
  field: PivotField;
  /** Ordered list of pivot buckets */
  buckets: PivotBucket[];
  /** Total number of changes across all buckets */
  total: number;
}

/**
 * Build a PivotResult from a map of key -> changes.
 */
export function buildPivotResult(
  field: PivotField,
  groups: Map<string, RouteChange[]>
): PivotResult {
  const buckets: PivotBucket[] = [];
  let total = 0;

  for (const [key, changes] of groups.entries()) {
    buckets.push({ key, changes, count: changes.length });
    total += changes.length;
  }

  // Sort buckets by descending count for readability
  buckets.sort((a, b) => b.count - a.count);

  return { field, buckets, total };
}
