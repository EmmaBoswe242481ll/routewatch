import { DEFAULT_RETRY_OPTIONS } from '../types';

describe('DEFAULT_RETRY_OPTIONS', () => {
  it('has expected default values', () => {
    expect(DEFAULT_RETRY_OPTIONS.maxAttempts).toBe(3);
    expect(DEFAULT_RETRY_OPTIONS.initialDelayMs).toBe(100);
    expect(DEFAULT_RETRY_OPTIONS.backoffFactor).toBe(2);
    expect(DEFAULT_RETRY_OPTIONS.maxDelayMs).toBe(5000);
  });

  it('does not define retryOn by default', () => {
    expect(DEFAULT_RETRY_OPTIONS.retryOn).toBeUndefined();
  });

  it('is a plain object with only expected keys', () => {
    const keys = Object.keys(DEFAULT_RETRY_OPTIONS);
    expect(keys).toContain('maxAttempts');
    expect(keys).toContain('initialDelayMs');
    expect(keys).toContain('backoffFactor');
    expect(keys).toContain('maxDelayMs');
  });
});
