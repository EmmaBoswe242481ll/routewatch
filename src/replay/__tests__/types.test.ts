import { describe, it, expect } from 'vitest';
import type { ReplayResult, ReplayError, ReplayState } from '../types';

describe('ReplayResult type', () => {
  it('can be constructed with all required fields', () => {
    const result: ReplayResult = {
      snapshotId: 'snap-abc',
      targetRef: 'HEAD',
      appliedAt: new Date().toISOString(),
      dryRun: false,
      changesReplayed: 2,
      skipped: 0,
      errors: [],
    };
    expect(result.snapshotId).toBe('snap-abc');
    expect(result.errors).toHaveLength(0);
  });
});

describe('ReplayError type', () => {
  it('holds route, method and reason', () => {
    const err: ReplayError = { route: '/api/test', method: 'GET', reason: 'not found' };
    expect(err.reason).toBe('not found');
  });
});

describe('ReplayState type', () => {
  it('holds replay history', () => {
    const state: ReplayState = {
      lastReplayId: 'snap-1',
      lastReplayAt: new Date().toISOString(),
      results: [],
    };
    expect(state.lastReplayId).toBe('snap-1');
    expect(Array.isArray(state.results)).toBe(true);
  });
});
