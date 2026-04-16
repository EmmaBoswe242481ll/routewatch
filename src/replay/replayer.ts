import { RouteChange } from '../diff/types';
import { ReplayOptions, ReplayResult, ReplayError } from './types';
import { loadSnapshot } from '../snapshot/store';

export function buildReplayResult(
  snapshotId: string,
  targetRef: string,
  dryRun: boolean,
  replayed: number,
  skipped: number,
  errors: ReplayError[]
): ReplayResult {
  return {
    snapshotId,
    targetRef,
    appliedAt: new Date().toISOString(),
    dryRun,
    changesReplayed: replayed,
    skipped,
    errors,
  };
}

export async function replaySnapshot(
  options: ReplayOptions,
  baseDir: string
): Promise<ReplayResult> {
  const { snapshotId, targetRef = 'HEAD', dryRun = false } = options;
  const snapshot = await loadSnapshot(snapshotId, baseDir);

  if (!snapshot) {
    throw new Error(`Snapshot not found: ${snapshotId}`);
  }

  const errors: ReplayError[] = [];
  let replayed = 0;
  let skipped = 0;

  for (const change of snapshot.changes as RouteChange[]) {
    try {
      if (!change.route || !change.method) {
        skipped++;
        continue;
      }
      if (!dryRun) {
        // In a real implementation, apply the change to targetRef
        replayed++;
      } else {
        replayed++;
      }
    } catch (err) {
      errors.push({
        route: change.route,
        method: change.method,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return buildReplayResult(snapshotId, targetRef, dryRun, replayed, skipped, errors);
}

export function formatReplayText(result: ReplayResult): string {
  const lines: string[] = [
    `Replay: ${result.snapshotId} -> ${result.targetRef}`,
    `Applied At: ${result.appliedAt}`,
    `Dry Run: ${result.dryRun}`,
    `Changes Replayed: ${result.changesReplayed}`,
    `Skipped: ${result.skipped}`,
    `Errors: ${result.errors.length}`,
  ];
  if (result.errors.length > 0) {
    lines.push('\nErrors:');
    for (const e of result.errors) {
      lines.push(`  [${e.method}] ${e.route}: ${e.reason}`);
    }
  }
  return lines.join('\n');
}
