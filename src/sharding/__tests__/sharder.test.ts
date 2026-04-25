import { shardChanges, buildShardSummary, formatShardText } from '../sharder';
import { RouteChange } from '../../diff/types';

function makeChange(method: string, path: string, type: RouteChange['type'] = 'added'): RouteChange {
  return {
    type,
    route: { method, path, params: [] },
  } as RouteChange;
}

describe('shardChanges', () => {
  it('distributes changes into the correct number of shards', () => {
    const changes = [
      makeChange('GET', '/users'),
      makeChange('POST', '/users'),
      makeChange('GET', '/posts'),
      makeChange('DELETE', '/posts/1'),
    ];
    const results = shardChanges(changes, { shardCount: 3, strategy: 'hash' });
    expect(results).toHaveLength(3);
    const total = results.reduce((sum, r) => sum + r.changes.length, 0);
    expect(total).toBe(4);
  });

  it('assigns shard indices 0..n-1', () => {
    const changes = [makeChange('GET', '/a'), makeChange('POST', '/b')];
    const results = shardChanges(changes, { shardCount: 4, strategy: 'hash' });
    results.forEach((r, i) => expect(r.shardIndex).toBe(i));
  });

  it('shards by prefix strategy', () => {
    const changes = [
      makeChange('GET', '/api/users'),
      makeChange('GET', '/api/posts'),
      makeChange('GET', '/health'),
    ];
    const results = shardChanges(changes, { shardCount: 2, strategy: 'prefix' });
    const total = results.reduce((sum, r) => sum + r.changes.length, 0);
    expect(total).toBe(3);
  });

  it('shards by method strategy', () => {
    const changes = [
      makeChange('GET', '/a'),
      makeChange('GET', '/b'),
      makeChange('POST', '/c'),
    ];
    const results = shardChanges(changes, { shardCount: 5, strategy: 'method' });
    const total = results.reduce((sum, r) => sum + r.changes.length, 0);
    expect(total).toBe(3);
  });

  it('handles empty changes', () => {
    const results = shardChanges([], { shardCount: 3, strategy: 'hash' });
    expect(results).toHaveLength(3);
    results.forEach(r => expect(r.changes).toHaveLength(0));
  });
});

describe('buildShardSummary', () => {
  it('returns correct summary', () => {
    const changes = [makeChange('GET', '/x'), makeChange('POST', '/y')];
    const results = shardChanges(changes, { shardCount: 2, strategy: 'hash' });
    const summary = buildShardSummary(results, 'hash');
    expect(summary.totalShards).toBe(2);
    expect(summary.strategy).toBe('hash');
    expect(Object.keys(summary.distribution)).toHaveLength(2);
  });
});

describe('formatShardText', () => {
  it('includes strategy and shard count', () => {
    const changes = [makeChange('GET', '/z')];
    const results = shardChanges(changes, { shardCount: 2, strategy: 'prefix' });
    const summary = buildShardSummary(results, 'prefix');
    const text = formatShardText(summary);
    expect(text).toContain('prefix');
    expect(text).toContain('Total shards: 2');
    expect(text).toContain('Distribution:');
  });
});
