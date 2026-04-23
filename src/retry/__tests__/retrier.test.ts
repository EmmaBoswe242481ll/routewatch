import { withRetry, formatRetryText } from '../retrier';
import { RetryResult } from '../types';

describe('withRetry', () => {
  it('returns value on first success', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, { initialDelayMs: 0 });
    expect(result.value).toBe('ok');
    expect(result.state.succeeded).toBe(true);
    expect(result.state.attempt).toBe(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockResolvedValue('recovered');
    const result = await withRetry(fn, { maxAttempts: 3, initialDelayMs: 0 });
    expect(result.value).toBe('recovered');
    expect(result.state.attempt).toBe(2);
    expect(result.state.errors).toEqual(['fail1']);
    expect(result.state.succeeded).toBe(true);
  });

  it('exhausts all attempts and returns finalError', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fails'));
    const result = await withRetry(fn, { maxAttempts: 3, initialDelayMs: 0 });
    expect(result.state.succeeded).toBe(false);
    expect(result.state.errors).toHaveLength(3);
    expect(result.finalError?.message).toBe('always fails');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('stops early when retryOn returns false', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('fatal'));
    const result = await withRetry(fn, {
      maxAttempts: 5,
      initialDelayMs: 0,
      retryOn: (e) => e.message !== 'fatal',
    });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(result.state.succeeded).toBe(false);
  });

  it('caps delay at maxDelayMs', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('e'));
    const result = await withRetry(fn, {
      maxAttempts: 3,
      initialDelayMs: 1,
      backoffFactor: 1000,
      maxDelayMs: 5,
    });
    expect(result.state.totalDelayMs).toBeLessThanOrEqual(10);
  });

  it('records totalDelayMs as zero when no retries occur', async () => {
    const fn = jest.fn().mockResolvedValue('instant');
    const result = await withRetry(fn, { initialDelayMs: 0 });
    expect(result.state.totalDelayMs).toBe(0);
  });
});

describe('formatRetryText', () => {
  it('formats a successful result', () => {
    const result: RetryResult<string> = {
      value: 'ok',
      state: { attempt: 1, totalDelayMs: 0, errors: [], succeeded: true },
    };
    const text = formatRetryText(result);
    expect(text).toContain('succeeded');
    expect(text).toContain('1 attempt');
  });

  it('formats a failed result with errors', () => {
    const result: RetryResult<never> = {
      state: { attempt: 3, totalDelayMs: 300, errors: ['e1', 'e2', 'e3'], succeeded: false },
      finalError: new Error('e3'),
    };
    const text = formatRetryText(result);
    expect(text).toContain('failed');
    expect(text).toContain('300ms');
    expect(text).toContain('[1] e1');
    expect(text).toContain('Final error: e3');
  });

  it('formats a successful result with multiple attempts', () => {
    const result: RetryResult<string> = {
      value: 'eventual',
      state: { attempt: 3, totalDelayMs: 150, errors: ['e1', 'e2'], succeeded: true },
    };
    const text = formatRetryText(result);
    expect(text).toContain('succeeded');
    expect(text).toContain('3 attempt');
    expect(text).toContain('150ms');
  });
});
