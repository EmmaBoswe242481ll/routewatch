import { RouteChange } from '../diff/types';

export interface BufferConfig {
  maxSize: number;
  flushInterval?: number; // ms
}

export interface BufferState {
  changes: RouteChange[];
  createdAt: number;
  flushedAt: number | null;
}

export function createBuffer(config: BufferConfig): BufferState {
  return {
    changes: [],
    createdAt: Date.now(),
    flushedAt: null,
  };
}

export function pushToBuffer(state: BufferState, change: RouteChange): BufferState {
  return { ...state, changes: [...state.changes, change] };
}

export function flushBuffer(state: BufferState): { flushed: RouteChange[]; state: BufferState } {
  const flushed = state.changes;
  return {
    flushed,
    state: { ...state, changes: [], flushedAt: Date.now() },
  };
}

export function isBufferFull(state: BufferState, config: BufferConfig): boolean {
  return state.changes.length >= config.maxSize;
}

export function isBufferExpired(state: BufferState, config: BufferConfig): boolean {
  if (!config.flushInterval) return false;
  return Date.now() - state.createdAt >= config.flushInterval;
}

export function formatBufferText(state: BufferState): string {
  const lines: string[] = [
    `Buffer: ${state.changes.length} change(s) queued`,
    `Created: ${new Date(state.createdAt).toISOString()}`,
    state.flushedAt ? `Last flushed: ${new Date(state.flushedAt).toISOString()}` : 'Never flushed',
  ];
  return lines.join('\n');
}
