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
