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

/** Returns true if the replay result completed without any errors. */
export function isSuccessfulReplay(result: ReplayResult): boolean {
  return result.errors.length === 0;
}

/** Returns the most recent replay result from state, or undefined if none exist. */
export function getLatestReplayResult(state: ReplayState): ReplayResult | undefined {
  return state.results.at(-1);
}
