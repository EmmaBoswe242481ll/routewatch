import { pinChanges, formatPinText, PinRule } from '../pinner';
import { RouteChange } from '../../diff/types';

function makeChange(route: string, type: 'added' | 'removed' | 'modified' = 'modified'): RouteChange {
  return { type, route, method: 'GET' } as any;
}

describe('pinChanges', () => {
  const rules: PinRule[] = [
    { pattern: '/api/v1/*', label: 'v1-api' },
    { pattern: '/health', label: 'health-check' },
  ];

  it('pins changes matching a rule', () => {
    const changes = [makeChange('/api/v1/users'), makeChange('/api/v2/items')];
    const result = pinChanges(changes, rules);
    expect(result.pinned).toHaveLength(1);
    expect(result.pinned[0].label).toBe('v1-api');
    expect(result.unpinned).toHaveLength(1);
  });

  it('returns all unpinned when no rules match', () => {
    const changes = [makeChange('/other'), makeChange('/route')];
    const result = pinChanges(changes, rules);
    expect(result.pinned).toHaveLength(0);
    expect(result.unpinned).toHaveLength(2);
  });

  it('pins exact match route', () => {
    const changes = [makeChange('/health')];
    const result = pinChanges(changes, rules);
    expect(result.pinned[0].label).toBe('health-check');
  });

  it('handles empty changes', () => {
    const result = pinChanges([], rules);
    expect(result.pinned).toHaveLength(0);
    expect(result.unpinned).toHaveLength(0);
  });

  it('handles empty rules', () => {
    const changes = [makeChange('/api/v1/users')];
    const result = pinChanges(changes, []);
    expect(result.unpinned).toHaveLength(1);
  });
});

describe('formatPinText', () => {
  it('formats pin result summary', () => {
    const changes = [makeChange('/api/v1/users')];
    const result = pinChanges(changes, [{ pattern: '/api/v1/*', label: 'v1' }]);
    const text = formatPinText(result);
    expect(text).toContain('Pinned: 1');
    expect(text).toContain('[PINNED]');
    expect(text).toContain('v1');
  });
});
