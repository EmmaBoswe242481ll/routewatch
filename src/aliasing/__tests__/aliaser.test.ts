import {
  resolveAlias,
  aliasRoute,
  aliasRoutes,
  formatAliasText,
  AliasRule,
} from '../aliaser';

const rules: AliasRule[] = [
  { pattern: '/api/v1/*', alias: 'v1-api' },
  { pattern: '/health', alias: 'health-check' },
];

describe('resolveAlias', () => {
  it('returns alias for matching pattern', () => {
    expect(resolveAlias('/api/v1/users', rules)).toBe('v1-api');
  });

  it('returns alias for exact match', () => {
    expect(resolveAlias('/health', rules)).toBe('health-check');
  });

  it('returns null for no match', () => {
    expect(resolveAlias('/api/v2/users', rules)).toBeNull();
  });

  it('returns first matching alias', () => {
    const overlapping: AliasRule[] = [
      { pattern: '/api/*', alias: 'first' },
      { pattern: '/api/v1/*', alias: 'second' },
    ];
    expect(resolveAlias('/api/v1/users', overlapping)).toBe('first');
  });
});

describe('aliasRoute', () => {
  it('returns original and alias', () => {
    const result = aliasRoute('/health', { rules });
    expect(result.original).toBe('/health');
    expect(result.alias).toBe('health-check');
  });

  it('returns null alias when no match', () => {
    const result = aliasRoute('/unknown', { rules });
    expect(result.alias).toBeNull();
  });
});

describe('aliasRoutes', () => {
  it('maps multiple routes', () => {
    const results = aliasRoutes(['/health', '/api/v1/items', '/other'], { rules });
    expect(results).toHaveLength(3);
    expect(results[0].alias).toBe('health-check');
    expect(results[1].alias).toBe('v1-api');
    expect(results[2].alias).toBeNull();
  });
});

describe('formatAliasText', () => {
  it('formats resolved aliases', () => {
    const aliased = aliasRoutes(['/health', '/api/v1/users'], { rules });
    const text = formatAliasText(aliased);
    expect(text).toContain('Resolved aliases (2)');
    expect(text).toContain('/health → health-check');
  });

  it('handles no aliases', () => {
    const text = formatAliasText([{ original: '/x', alias: null }]);
    expect(text).toBe('No aliases resolved.');
  });
});
