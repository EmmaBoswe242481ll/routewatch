export interface ReplayOptions {
  snapshotId: string;
  targetRef?: string;
  dryRun?: boolean;
  outputDir?: string;
}

export interface ReplayResult {
  snapshotId: string;
  targetRef: string;
  appliedAt: string;
  dryRun: boolean;
  changesReplayed: number;
  skipped: number;
  errors: ReplayError[];
}

export interface ReplayError {
  route: string;
  method: string;
  reason: string;
}

export interface ReplayState {
  lastReplayId: string;
  lastReplayAt: string;
  results: ReplayResult[];
}
