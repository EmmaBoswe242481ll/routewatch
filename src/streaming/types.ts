import { RouteChange } from '../diff/types';

export interface StreamResult {
  chunks: import('./streamer').StreamChunk[];
  totalChanges: number;
  totalChunks: number;
}

export function buildStreamResult(
  chunks: import('./streamer').StreamChunk[]
): StreamResult {
  return {
    chunks,
    totalChanges: chunks.reduce((sum, c) => sum + c.changes.length, 0),
    totalChunks: chunks.length,
  };
}

export function isCompleteStream(result: StreamResult): boolean {
  return result.totalChunks > 0 && result.totalChanges > 0;
}
