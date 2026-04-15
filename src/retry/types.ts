export interface RetryOptions {
  maxAttempts: number;
  initialDelayMs: number;
  backoffFactor: number;
  maxDelayMs: number;
  retryOn?: (error: Error) => boolean;
}

export interface RetryState {
  attempt: number;
  totalDelayMs: number;
  errors: string[];
  succeeded: boolean;
}

export interface RetryResult<T> {
  value?: T;
  state: RetryState;
  finalError?: Error;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 100,
  backoffFactor: 2,
  maxDelayMs: 5000,
};
