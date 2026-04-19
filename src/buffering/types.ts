import { RouteChange } from '../diff/types';

export interface FlushResult {
  flushed: RouteChange[];
  count: number;
  timestamp: number;
}

export function buildFlushResult(flushed: RouteChange[]): FlushResult {
  return {
    flushed,
    count: flushed.length,
    timestamp: Date.now(),
  };
}

export function isEmptyFlush(result: FlushResult): boolean {
  return result.count === 0;
}
