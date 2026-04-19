import { RouteChange } from '../diff/types';

export interface StreamOptions {
  chunkSize?: number;
  delimiter?: string;
  format?: 'json' | 'ndjson' | 'text';
}

export interface StreamChunk {
  index: number;
  total: number;
  changes: RouteChange[];
}

const DEFAULT_CHUNK_SIZE = 10;

export function* streamChanges(
  changes: RouteChange[],
  options: StreamOptions = {}
): Generator<StreamChunk> {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const total = Math.ceil(changes.length / chunkSize);
  for (let i = 0; i < changes.length; i += chunkSize) {
    yield {
      index: Math.floor(i / chunkSize),
      total,
      changes: changes.slice(i, i + chunkSize),
    };
  }
}

export function serializeChunk(chunk: StreamChunk, format: StreamOptions['format'] = 'json'): string {
  if (format === 'ndjson') {
    return chunk.changes.map(c => JSON.stringify(c)).join('\n');
  }
  if (format === 'text') {
    return chunk.changes
      .map(c => `[${c.type.toUpperCase()}] ${c.method} ${c.path}`)
      .join('\n');
  }
  return JSON.stringify(chunk);
}

export function formatStreamText(chunks: StreamChunk[]): string {
  const total = chunks.reduce((sum, c) => sum + c.changes.length, 0);
  return `Streamed ${total} change(s) across ${chunks.length} chunk(s).`;
}
