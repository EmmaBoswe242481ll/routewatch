export interface RouteSnapshot {
  id: string;
  timestamp: number;
  commitHash: string;
  branch: string;
  routes: SnapshotRoute[];
}

export interface SnapshotRoute {
  path: string;
  method: string;
  params: string[];
  file: string;
  framework: 'nextjs' | 'express';
}

export interface SnapshotDiff {
  from: RouteSnapshot;
  to: RouteSnapshot;
  added: SnapshotRoute[];
  removed: SnapshotRoute[];
  modified: SnapshotRoute[];
}

export interface SnapshotStoreOptions {
  dir?: string;
  maxSnapshots?: number;
}
