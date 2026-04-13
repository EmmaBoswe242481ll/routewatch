export type ChangeType = 'added' | 'removed' | 'modified';

export interface RouteChange {
  type: ChangeType;
  method: string;
  path: string;
  params?: string[];
  before?: {
    method: string;
    path: string;
    params?: string[];
  };
  after?: {
    method: string;
    path: string;
    params?: string[];
  };
}

export interface DiffResult {
  fromCommit: string;
  toCommit: string;
  changes: RouteChange[];
  summary: {
    added: number;
    removed: number;
    modified: number;
    total: number;
  };
}
