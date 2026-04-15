export interface CommitRange {
  from: string;
  to: string;
}

export interface CompareOptions {
  range: CommitRange;
  framework?: 'nextjs' | 'express' | 'auto';
  filters?: {
    methods?: string[];
    patterns?: string[];
  };
  useCache?: boolean;
}

export interface CompareResult {
  range: CommitRange;
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
  report: import('../reporters/types').Report;
  summary: import('../summary/types').Summary;
}

/**
 * Returns true if the compare result contains any route changes
 * (additions, removals, or modifications).
 */
export function hasChanges(result: CompareResult): boolean {
  return result.added > 0 || result.removed > 0 || result.modified > 0;
}

/**
 * Returns the total number of routes across all change categories.
 */
export function totalRoutes(result: CompareResult): number {
  return result.added + result.removed + result.modified + result.unchanged;
}
