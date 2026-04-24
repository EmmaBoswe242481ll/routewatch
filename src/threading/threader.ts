import { RouteChange } from '../diff/types';

export interface ThreadConfig {
  threadCount: number;
  chunkSize?: number;
}

export interface ThreadResult {
  threadId: number;
  changes: RouteChange[];
  processedAt: string;
}

export interface ThreadSummary {
  totalThreads: number;
  totalChanges: number;
  results: ThreadResult[];
}

export function partitionIntoThreads(
  changes: RouteChange[],
  config: ThreadConfig
): RouteChange[][] {
  const { threadCount, chunkSize } = config;
  if (threadCount <= 0) return [changes];

  const size = chunkSize ?? Math.ceil(changes.length / threadCount);
  const partitions: RouteChange[][] = [];

  for (let i = 0; i < changes.length; i += size) {
    partitions.push(changes.slice(i, i + size));
  }

  return partitions;
}

export function buildThreadResults(
  partitions: RouteChange[][]
): ThreadResult[] {
  return partitions.map((changes, idx) => ({
    threadId: idx + 1,
    changes,
    processedAt: new Date().toISOString(),
  }));
}

export function buildThreadSummary(
  results: ThreadResult[]
): ThreadSummary {
  return {
    totalThreads: results.length,
    totalChanges: results.reduce((sum, r) => sum + r.changes.length, 0),
    results,
  };
}

export function threadChanges(
  changes: RouteChange[],
  config: ThreadConfig
): ThreadSummary {
  const partitions = partitionIntoThreads(changes, config);
  const results = buildThreadResults(partitions);
  return buildThreadSummary(results);
}

export function formatThreadText(summary: ThreadSummary): string {
  const lines: string[] = [
    `Threads: ${summary.totalThreads}`,
    `Total changes: ${summary.totalChanges}`,
  ];
  for (const r of summary.results) {
    lines.push(`  Thread #${r.threadId}: ${r.changes.length} change(s)`);
  }
  return lines.join('\n');
}
