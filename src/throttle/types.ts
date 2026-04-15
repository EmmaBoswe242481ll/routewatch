export interface ThrottleOptions {
  /** Duration of the sliding window in milliseconds. Default: 60000 */
  windowMs?: number;
  /** Maximum number of calls allowed within the window. Default: 10 */
  maxCalls?: number;
}

export interface ThrottleState {
  /** Timestamps (ms) of calls within the current window */
  calls: number[];
  /** Whether the last check was blocked */
  blocked: boolean;
}

export interface ThrottleResult {
  /** Whether the call is permitted */
  allowed: boolean;
  /** How many more calls are allowed before the window is exhausted */
  remaining: number;
  /** Milliseconds until the caller may retry (0 when allowed) */
  retryAfterMs: number;
}
