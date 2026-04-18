import { flagChange, flagChanges, formatFlagText } from '../flagger';
import { FlagRule } from '../flagger';
import { RouteChange } from '../../diff/types';

function makeChange(overrides: Partial<RouteChange> = {}): RouteChange {
  return {
    type: 'modified',
    path: '/api/users',
    method: 'GET',
    before: { path: '/api/users', method: 'GET', params: [] },
    after: { path: '/api/users', method: 'GET', params: [] },
    paramChanges: [],
    ...overrides,
  };
}

const rules: FlagRule[] = [
  { field: 'path', pattern: 'admin', flag: 'sensitive', reason: 'Admin route' },
  { field: 'method', pattern: 'DELETE', flag: 'destructive', reason: 'Deletes data' },
  { field: 'changeType', pattern: 'removed', flag: 'breaking' },
];

describe('flagChange', () => {
  it('returns null when no rules match', () => {
    const result = flagChange(makeChange(), rules);
    expect(result).toBeNull();
  });

  it('flags a change matching a path rule', () => {
    const result = flagChange(makeChange({ path: '/api/admin/users' }), rules);
    expect(result).not.toBeNull();
    expect(result!.flags).toContain('sensitive');
    expect(result!.reasons).toContain('Admin route');
  });

  it('flags a change matching a method rule', () => {
    const result = flagChange(makeChange({ method: 'DELETE' }), rules);
    expect(result!.flags).toContain('destructive');
  });

  it('flags a removed change', () => {
    const result = flagChange(makeChange({ type: 'removed' }), rules);
    expect(result!.flags).toContain('breaking');
  });

  it('collects multiple flags', () => {
    const result = flagChange(makeChange({ path: '/admin', method: 'DELETE' }), rules);
    expect(result!.flags).toHaveLength(2);
  });
});

describe('flagChanges', () => {
  it('partitions flagged and clean changes', () => {
    const changes = [
      makeChange({ path: '/api/users' }),
      makeChange({ path: '/api/admin' }),
      makeChange({ method: 'DELETE' }),
    ];
    const result = flagChanges(changes, rules);
    expect(result.clean).toHaveLength(1);
    expect(result.flagged).toHaveLength(2);
  });

  it('counts total flags correctly', () => {
    const changes = [makeChange({ path: '/admin', method: 'DELETE' })];
    const result = flagChanges(changes, rules);
    expect(result.totalFlags).toBe(2);
  });

  it('returns all clean when no rules match', () => {
    const result = flagChanges([makeChange(), makeChange()], []);
    expect(result.clean).toHaveLength(2);
    expect(result.flagged).toHaveLength(0);
  });
});

describe('formatFlagText', () => {
  it('includes summary line', () => {
    const result = flagChanges([makeChange({ path: '/admin' })], rules);
    const text = formatFlagText(result);
    expect(text).toContain('Flagged: 1');
    expect(text).toContain('sensitive');
  });
});
