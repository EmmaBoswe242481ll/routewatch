import {
  maskPathSegments,
  maskQueryParams,
  maskRoute,
  maskRoutes,
} from '../masker';
import type { MaskRule, MaskOptions } from '../masker';

const tokenRule: MaskRule = { pattern: 'token', replacement: '[REDACTED]' };
const secretRule: MaskRule = { pattern: /secret/i };
const idRule: MaskRule = { pattern: /^\d+$/, replacement: ':id' };

describe('maskPathSegments', () => {
  it('replaces matching segments with the replacement string', () => {
    expect(maskPathSegments('/api/token/abc', [tokenRule])).toBe('/api/[REDACTED]/abc');
  });

  it('uses *** as default replacement when none specified', () => {
    expect(maskPathSegments('/api/secret/data', [secretRule])).toBe('/api/***/data');
  });

  it('replaces numeric segments using regex rule', () => {
    expect(maskPathSegments('/users/42/profile', [idRule])).toBe('/users/:id/profile');
  });

  it('returns original path when no rules match', () => {
    expect(maskPathSegments('/api/users', [tokenRule])).toBe('/api/users');
  });

  it('applies first matching rule only', () => {
    const rules: MaskRule[] = [
      { pattern: 'key', replacement: 'A' },
      { pattern: 'key', replacement: 'B' },
    ];
    expect(maskPathSegments('/api/key', rules)).toBe('/api/A');
  });
});

describe('maskQueryParams', () => {
  it('masks matching param names', () => {
    const result = maskQueryParams({ token: 'abc123' }, [tokenRule], false);
    expect(result).toEqual({ '[REDACTED]': 'abc123' });
  });

  it('masks param values when maskValues is true', () => {
    const result = maskQueryParams({ token: 'abc123' }, [tokenRule], true);
    expect(result).toEqual({ '[REDACTED]': '[REDACTED]' });
  });

  it('leaves non-matching params untouched', () => {
    const result = maskQueryParams({ page: '1', limit: '20' }, [tokenRule], true);
    expect(result).toEqual({ page: '1', limit: '20' });
  });
});

describe('maskRoute', () => {
  const options: MaskOptions = { rules: [tokenRule, idRule], maskQueryValues: true };

  it('masks path segments only when no query string', () => {
    expect(maskRoute('/api/token/42', options)).toBe('/api/[REDACTED]/:id');
  });

  it('masks both path and query string', () => {
    const result = maskRoute('/api/users?token=abc&page=1', options);
    expect(result).toBe('/api/users?[REDACTED]=[REDACTED]&page=1');
  });

  it('handles routes without leading slash', () => {
    expect(maskRoute('api/token', options)).toBe('api/[REDACTED]');
  });
});

describe('maskRoutes', () => {
  it('applies masking to every route in the array', () => {
    const routes = ['/api/token/42', '/api/users', '/api/secret/data'];
    const options: MaskOptions = { rules: [tokenRule, secretRule, idRule] };
    const result = maskRoutes(routes, options);
    expect(result).toEqual(['/api/[REDACTED]/:id', '/api/users', '/api/***/data']);
  });

  it('returns empty array for empty input', () => {
    expect(maskRoutes([], { rules: [tokenRule] })).toEqual([]);
  });
});
