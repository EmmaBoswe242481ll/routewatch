import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildReplayResult, formatReplayText } from '../replayer';
import type { ReplayResult } from '../types';

vi.mock('../../snapshot/store', () => ({
  loadSnapshot: vi.fn(),
}));

import { loadSnapshot } from '../../snapshot/store';
import { replaySnapshot } from '../replayer';

describe('buildReplayResult', () => {
  it('builds a result with correct fields', () => {
    const result = buildReplayResult('snap-1', 'HEAD', false, 3, 1, []);
    expect(result.snapshotId).toBe('snap-1');
    expect(result.targetRef).toBe('HEAD');
    expect(result.dryRun).toBe(false);
    expect(result.changesReplayed).toBe(3);
    expect(result.skipped).toBe(1);
    expect(result.errors).toHaveLength(0);
    expect(result.appliedAt).toBeTruthy();
  });
});

describe('replaySnapshot', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws if snapshot not found', async () => {
    vi.mocked(loadSnapshot).mockResolvedValue(null as any);
    await expect(replaySnapshot({ snapshotId: 'missing' }, '/tmp')).rejects.toThrow('Snapshot not found');
  });

  it('replays changes from snapshot', async () => {
    vi.mocked(loadSnapshot).mockResolvedValue({
      id: 'snap-1',
      changes: [
        { route: '/api/users', method: 'GET', type: 'added' },
        { route: '/api/posts', method: 'POST', type: 'removed' },
      ],
    } as any);
    const result = await replaySnapshot({ snapshotId: 'snap-1', dryRun: true }, '/tmp');
    expect(result.changesReplayed).toBe(2);
    expect(result.skipped).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('skips changes missing route or method', async () => {
    vi.mocked(loadSnapshot).mockResolvedValue({
      id: 'snap-2',
      changes: [{ type: 'added' }],
    } as any);
    const result = await replaySnapshot({ snapshotId: 'snap-2' }, '/tmp');
    expect(result.skipped).toBe(1);
    expect(result.changesReplayed).toBe(0);
  });
});

describe('formatReplayText', () => {
  it('formats result without errors', () => {
    const result: ReplayResult = buildReplayResult('snap-1', 'main', true, 5, 0, []);
    const text = formatReplayText(result);
    expect(text).toContain('snap-1');
    expect(text).toContain('main');
    expect(text).toContain('Changes Replayed: 5');
    expect(text).not.toContain('Errors:');
  });

  it('formats result with errors', () => {
    const result: ReplayResult = buildReplayResult('snap-2', 'HEAD', false, 1, 0, [
      { route: '/api/x', method: 'DELETE', reason: 'conflict' },
    ]);
    const text = formatReplayText(result);
    expect(text).toContain('Errors:');
    expect(text).toContain('/api/x');
    expect(text).toContain('conflict');
  });
});
