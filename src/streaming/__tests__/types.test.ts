import { buildStreamResult, isCompleteStream } from '../types';
import { StreamChunk } from '../streamer';
import { RouteChange } from '../../diff/types';

function makeChunk(count: number, index = 0): StreamChunk {
  const changes: RouteChange[] = Array.from({ length: count }, (_, i) => ({
    type: 'added',
    path: `/r/${i}`,
    method: 'GET',
    params: [],
  }));
  return { index, total: 1, changes };
}

describe('buildStreamResult', () => {
  it('computes totals from chunks', () => {
    const result = buildStreamResult([makeChunk(5, 0), makeChunk(3, 1)]);
    expect(result.totalChanges).toBe(8);
    expect(result.totalChunks).toBe(2);
  });

  it('handles empty chunks array', () => {
    const result = buildStreamResult([]);
    expect(result.totalChanges).toBe(0);
    expect(result.totalChunks).toBe(0);
  });
});

describe('isCompleteStream', () => {
  it('returns true when chunks and changes exist', () => {
    const result = buildStreamResult([makeChunk(2)]);
    expect(isCompleteStream(result)).toBe(true);
  });

  it('returns false for empty result', () => {
    const result = buildStreamResult([]);
    expect(isCompleteStream(result)).toBe(false);
  });

  it('returns false when chunks have no changes', () => {
    const result = buildStreamResult([makeChunk(0)]);
    expect(isCompleteStream(result)).toBe(false);
  });
});
