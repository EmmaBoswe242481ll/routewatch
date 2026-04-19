import { streamChanges, serializeChunk, formatStreamText, StreamChunk } from '../streamer';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, method = 'GET'): RouteChange {
  return { type: 'added', path, method, params: [] };
}

describe('streamChanges', () => {
  it('yields chunks of the given size', () => {
    const changes = Array.from({ length: 25 }, (_, i) => makeChange(`/route/${i}`));
    const chunks = [...streamChanges(changes, { chunkSize: 10 })];
    expect(chunks).toHaveLength(3);
    expect(chunks[0].changes).toHaveLength(10);
    expect(chunks[2].changes).toHaveLength(5);
  });

  it('sets index and total correctly', () => {
    const changes = Array.from({ length: 20 }, (_, i) => makeChange(`/r/${i}`));
    const chunks = [...streamChanges(changes, { chunkSize: 10 })];
    expect(chunks[0].index).toBe(0);
    expect(chunks[1].index).toBe(1);
    expect(chunks[0].total).toBe(2);
  });

  it('uses default chunk size', () => {
    const changes = Array.from({ length: 15 }, (_, i) => makeChange(`/x/${i}`));
    const chunks = [...streamChanges(changes)];
    expect(chunks[0].changes).toHaveLength(10);
    expect(chunks[1].changes).toHaveLength(5);
  });

  it('handles empty changes', () => {
    const chunks = [...streamChanges([])];
    expect(chunks).toHaveLength(0);
  });
});

describe('serializeChunk', () => {
  const chunk: StreamChunk = {
    index: 0,
    total: 1,
    changes: [makeChange('/api/users'), makeChange('/api/posts', 'POST')],
  };

  it('serializes as json by default', () => {
    const out = serializeChunk(chunk);
    const parsed = JSON.parse(out);
    expect(parsed.index).toBe(0);
    expect(parsed.changes).toHaveLength(2);
  });

  it('serializes as ndjson', () => {
    const out = serializeChunk(chunk, 'ndjson');
    const lines = out.split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]).path).toBe('/api/users');
  });

  it('serializes as text', () => {
    const out = serializeChunk(chunk, 'text');
    expect(out).toContain('[ADDED] GET /api/users');
    expect(out).toContain('[ADDED] POST /api/posts');
  });
});

describe('formatStreamText', () => {
  it('summarizes chunks', () => {
    const chunks: StreamChunk[] = [
      { index: 0, total: 2, changes: [makeChange('/a'), makeChange('/b')] },
      { index: 1, total: 2, changes: [makeChange('/c')] },
    ];
    const text = formatStreamText(chunks);
    expect(text).toContain('3 change(s)');
    expect(text).toContain('2 chunk(s)');
  });
});
