import { splitChanges, formatSplitText } from '../splitter';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, method: string, type: RouteChange['type']): RouteChange {
  return { path, method, type } as RouteChange;
}

describe('splitChanges', () => {
  const changes: RouteChange[] = [
    makeChange('/api/users', 'GET', 'added'),
    makeChange('/api/users', 'POST', 'added'),
    makeChange('/api/posts', 'GET', 'removed'),
    makeChange('/api/posts', 'DELETE', 'removed'),
    makeChange('/api/tags', 'GET', 'modified'),
  ];

  it('splits by changeType by default', () => {
    const result = splitChanges(changes);
    expect(result.totalChanges).toBe(5);
    // 3 groups: added(2), removed(2), modified(1)
    expect(result.chunks.length).toBe(3);
  });

  it('respects maxChunkSize', () => {
    const result = splitChanges(changes, { maxChunkSize: 1 });
    expect(result.totalChunks).toBe(5);
    result.chunks.forEach(c => expect(c.length).toBe(1));
  });

  it('splits by method', () => {
    const result = splitChanges(changes, { splitBy: 'method' });
    const methods = result.chunks.map(c => c[0].method);
    expect(new Set(methods).size).toBe(result.chunks.length);
  });

  it('splits by prefix', () => {
    const result = splitChanges(changes, { splitBy: 'prefix' });
    // prefixes: /api — all share same prefix
    expect(result.chunks.length).toBe(1);
    expect(result.chunks[0].length).toBe(5);
  });

  it('handles empty changes', () => {
    const result = splitChanges([]);
    expect(result.totalChunks).toBe(0);
    expect(result.chunks).toEqual([]);
  });

  it('returns correct config in result', () => {
    const result = splitChanges(changes, { maxChunkSize: 3, splitBy: 'method' });
    expect(result.config.maxChunkSize).toBe(3);
    expect(result.config.splitBy).toBe('method');
  });
});

describe('formatSplitText', () => {
  it('formats split result as text', () => {
    const result = splitChanges(
      [makeChange('/a', 'GET', 'added'), makeChange('/b', 'POST', 'removed')],
      { maxChunkSize: 10, splitBy: 'changeType' }
    );
    const text = formatSplitText(result);
    expect(text).toContain('2 changes');
    expect(text).toContain('chunks');
    expect(text).toContain('Chunk 1');
  });
});
