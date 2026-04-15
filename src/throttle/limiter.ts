import { ThrottleOptions, ThrottleState, ThrottleResult } from './types';

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_CALLS = 10;

export function createThrottleState(): ThrottleState {
  return { calls: [], blocked: false };
}

export function checkThrottle(
  state: ThrottleState,
  options: ThrottleOptions
): ThrottleResult {
  const now = Date.now();
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const maxCalls = options.maxCalls ?? DEFAULT_MAX_CALLS;

  // Evict calls outside the current window
  state.calls = state.calls.filter((ts) => now - ts < windowMs);

  if (state.calls.length >= maxCalls) {
    const oldest = state.calls[0];
    const retryAfterMs = windowMs - (now - oldest);
    state.blocked = true;
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  state.calls.push(now);
  state.blocked = false;
  return {
    allowed: true,
    remaining: maxCalls - state.calls.length,
    retryAfterMs: 0,
  };
}

export function resetThrottle(state: ThrottleState): void {
  state.calls = [];
  state.blocked = false;
}

export function formatThrottleText(result: ThrottleResult): string {
  if (result.allowed) {
    return `Request allowed. Remaining calls in window: ${result.remaining}.`;
  }
  return `Request throttled. Retry after ${result.retryAfterMs}ms.`;
}
