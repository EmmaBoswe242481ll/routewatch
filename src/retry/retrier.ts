import { RetryOptions, RetryResult, RetryState, DEFAULT_RETRY_OPTIONS } from './types';

function computeDelay(attempt: number, opts: RetryOptions): number {
  const delay = opts.initialDelayMs * Math.pow(opts.backoffFactor, attempt - 1);
  return Math.min(delay, opts.maxDelayMs);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<RetryResult<T>> {
  const opts: RetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
  const state: RetryState = {
    attempt: 0,
    totalDelayMs: 0,
    errors: [],
    succeeded: false,
  };

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    state.attempt = attempt;
    try {
      const value = await fn();
      state.succeeded = true;
      return { value, state };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      lastError = error;
      state.errors.push(error.message);

      if (opts.retryOn && !opts.retryOn(error)) {
        break;
      }

      if (attempt < opts.maxAttempts) {
        const delay = computeDelay(attempt, opts);
        state.totalDelayMs += delay;
        await sleep(delay);
      }
    }
  }

  return { state, finalError: lastError };
}

export function formatRetryText(result: RetryResult<unknown>): string {
  const { state } = result;
  const lines: string[] = [
    `Retry summary: ${state.succeeded ? 'succeeded' : 'failed'} after ${state.attempt} attempt(s)`,
    `Total delay: ${state.totalDelayMs}ms`,
  ];
  if (state.errors.length > 0) {
    lines.push('Errors encountered:');
    state.errors.forEach((e, i) => lines.push(`  [${i + 1}] ${e}`));
  }
  if (result.finalError) {
    lines.push(`Final error: ${result.finalError.message}`);
  }
  return lines.join('\n');
}
