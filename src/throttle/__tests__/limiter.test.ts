import {
  createThrottleState,
  checkThrottle,
  resetThrottle,
  formatThrottleText,
} from '../limiter';
import { ThrottleOptions } from '../types';

describe('createThrottleState', () => {
  it('returns an empty, unblocked state', () => {
    const state = createThrottleState();
    expect(state.calls).toEqual([]);
    expect(state.blocked).toBe(false);
  });
});

describe('checkThrottle', () => {
  const opts: ThrottleOptions = { windowMs: 5000, maxCalls: 3 };

  it('allows calls under the limit', () => {
    const state = createThrottleState();
    const result = checkThrottle(state, opts);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
    expect(result.retryAfterMs).toBe(0);
  });

  it('blocks when limit is reached', () => {
    const state = createThrottleState();
    checkThrottle(state, opts);
    checkThrottle(state, opts);
    checkThrottle(state, opts);
    const result = checkThrottle(state, opts);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterMs).toBeGreaterThan(0);
    expect(state.blocked).toBe(true);
  });

  it('evicts stale calls outside the window', () => {
    const state = createThrottleState();
    const past = Date.now() - 6000;
    state.calls = [past, past, past];
    const result = checkThrottle(state, opts);
    expect(result.allowed).toBe(true);
  });

  it('uses default limits when options are omitted', () => {
    const state = createThrottleState();
    const result = checkThrottle(state, {});
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });
});

describe('resetThrottle', () => {
  it('clears calls and unblocks state', () => {
    const state = createThrottleState();
    state.calls = [Date.now()];
    state.blocked = true;
    resetThrottle(state);
    expect(state.calls).toEqual([]);
    expect(state.blocked).toBe(false);
  });
});

describe('formatThrottleText', () => {
  it('formats an allowed result', () => {
    const text = formatThrottleText({ allowed: true, remaining: 5, retryAfterMs: 0 });
    expect(text).toContain('allowed');
    expect(text).toContain('5');
  });

  it('formats a blocked result', () => {
    const text = formatThrottleText({ allowed: false, remaining: 0, retryAfterMs: 1200 });
    expect(text).toContain('throttled');
    expect(text).toContain('1200ms');
  });
});
