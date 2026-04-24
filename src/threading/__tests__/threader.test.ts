import {
  partitionIntoThreads,
  buildThreadResults,
  buildThreadSummary,
  threadChanges,
  formatThreadText,
} from '../threader';
import { RouteChange } from '../../diff/types';

function makeChange(path: string): RouteChange {
  return {
    type: 'added',
    route: { path, method: 'GET', params: [], source: 'nextjs', filePath: '' },
  };
}

describe('partitionIntoThreads', () => {
  it('splits changes evenly across threads', () => {
    const changes = [makeChange('/a'), makeChange('/b'), makeChange('/c'), makeChange('/d')];
    const result = partitionIntoThreads(changes, { threadCount: 2 });
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveLength(2);
    expect(result[1]).toHaveLength(2);
  });

  it('respects explicit chunkSize', () => {
    const changes = [makeChange('/a'), makeChange('/b'), makeChange('/c')];
    const result = partitionIntoThreads(changes, { threadCount: 2, chunkSize: 1 });
    expect(result).toHaveLength(3);
  });

  it('returns single partition for threadCount <= 0', () => {
    const changes = [makeChange('/a'), makeChange('/b')];
    const result = partitionIntoThreads(changes, { threadCount: 0 });
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(2);
  });

  it('handles empty changes', () => {
    const result = partitionIntoThreads([], { threadCount: 4 });
    expect(result).toHaveLength(0);
  });
});

describe('buildThreadResults', () => {
  it('assigns sequential thread IDs starting at 1', () => {
    const partitions = [[makeChange('/a')], [makeChange('/b')]];
    const results = buildThreadResults(partitions);
    expect(results[0].threadId).toBe(1);
    expect(results[1].threadId).toBe(2);
  });

  it('includes processedAt timestamp', () => {
    const results = buildThreadResults([[makeChange('/x')]]);
    expect(results[0].processedAt).toBeTruthy();
    expect(new Date(results[0].processedAt).getTime()).not.toBeNaN();
  });
});

describe('buildThreadSummary', () => {
  it('aggregates totals correctly', () => {
    const partitions = [[makeChange('/a'), makeChange('/b')], [makeChange('/c')]];
    const results = buildThreadResults(partitions);
    const summary = buildThreadSummary(results);
    expect(summary.totalThreads).toBe(2);
    expect(summary.totalChanges).toBe(3);
  });
});

describe('threadChanges', () => {
  it('returns a complete summary', () => {
    const changes = [makeChange('/a'), makeChange('/b'), makeChange('/c')];
    const summary = threadChanges(changes, { threadCount: 3 });
    expect(summary.totalThreads).toBe(3);
    expect(summary.totalChanges).toBe(3);
  });
});

describe('formatThreadText', () => {
  it('includes thread and change counts', () => {
    const changes = [makeChange('/a'), makeChange('/b')];
    const summary = threadChanges(changes, { threadCount: 2 });
    const text = formatThreadText(summary);
    expect(text).toContain('Threads: 2');
    expect(text).toContain('Total changes: 2');
    expect(text).toContain('Thread #1');
    expect(text).toContain('Thread #2');
  });
});
