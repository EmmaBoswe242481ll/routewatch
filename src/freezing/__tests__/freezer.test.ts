import { freezeChanges, isFrozen, formatFreezeText, FreezeRule } from '../freezer';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, method = 'GET'): RouteChange {
  return { path, method, type: 'modified', before: null, after: null } as any;
}

const rules: FreezeRule[] = [
  { pattern: '/api/v1/*', reason: 'stable API' },
  { pattern: '/health', reason: 'infra' },
];

describe('isFrozen', () => {
  it('returns true when path matches a rule', () => {
    expect(isFrozen(makeChange('/api/v1/users'), rules)).toBe(true);
  });

  it('returns false when path does not match', () => {
    expect(isFrozen(makeChange('/api/v2/users'), rules)).toBe(false);
  });

  it('matches exact path', () => {
    expect(isFrozen(makeChange('/health'), rules)).toBe(true);
  });
});

describe('freezeChanges', () => {
  it('partitions changes into frozen and unfrozen', () => {
    const changes = [
      makeChange('/api/v1/users'),
      makeChange('/api/v2/orders'),
      makeChange('/health'),
    ];
    const result = freezeChanges(changes, rules);
    expect(result.frozen).toHaveLength(2);
    expect(result.unfrozen).toHaveLength(1);
    expect(result.unfrozen[0].path).toBe('/api/v2/orders');
  });

  it('returns all unfrozen when no rules match', () => {
    const changes = [makeChange('/api/v3/new')];
    const result = freezeChanges(changes, rules);
    expect(result.frozen).toHaveLength(0);
    expect(result.unfrozen).toHaveLength(1);
  });

  it('returns empty arrays for empty input', () => {
    const result = freezeChanges([], rules);
    expect(result.frozen).toHaveLength(0);
    expect(result.unfrozen).toHaveLength(0);
  });
});

describe('formatFreezeText', () => {
  it('includes counts in header', () => {
    const result = freezeChanges([makeChange('/api/v1/users'), makeChange('/other')], rules);
    const text = formatFreezeText(result);
    expect(text).toContain('1 frozen');
    expect(text).toContain('1 unfrozen');
  });

  it('includes reason when present', () => {
    const result = freezeChanges([makeChange('/api/v1/users')], rules);
    const text = formatFreezeText(result);
    expect(text).toContain('stable API');
  });

  it('omits frozen section when none frozen', () => {
    const result = freezeChanges([makeChange('/api/v2/x')], rules);
    const text = formatFreezeText(result);
    expect(text).not.toContain('Frozen routes:');
  });
});
