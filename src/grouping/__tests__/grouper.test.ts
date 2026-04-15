import { groupChanges, groupByPrefix, groupByMethod, groupByChangeType } from '../grouper';
import { RouteChange } from '../../diff/types';

function makeChange(overrides: Partial<RouteChange> = {}): RouteChange {
  return {
    type: 'modified',
    before: { method: 'GET', path: '/api/users', params: [] },
    after: { method: 'GET', path: '/api/users', params: [] },
    paramChanges: [],
    ...overrides,
  };
}

const changes: RouteChange[] = [
  makeChange({ before: { method: 'GET', path: '/api/users', params: [] }, after: { method: 'GET', path: '/api/users', params: [] } }),
  makeChange({ type: 'added', before: undefined, after: { method: 'POST', path: '/api/users', params: [] } }),
  makeChange({ type: 'removed', before: { method: 'DELETE', path: '/api/posts/1', params: [] }, after: undefined }),
  makeChange({ before: { method: 'GET', path: '/health', params: [] }, after: { method: 'GET', path: '/health', params: [] } }),
];

describe('groupByPrefix', () => {
  it('groups by top-level prefix', () => {
    const groups = groupByPrefix(changes, 1);
    const labels = groups.map(g => g.label);
    expect(labels).toContain('/api');
    expect(labels).toContain('/health');
  });

  it('groups by deeper prefix', () => {
    const groups = groupByPrefix(changes, 2);
    const labels = groups.map(g => g.label);
    expect(labels).toContain('/api/users');
    expect(labels).toContain('/api/posts');
  });
});

describe('groupByMethod', () => {
  it('groups by HTTP method', () => {
    const groups = groupByMethod(changes);
    const labels = groups.map(g => g.label);
    expect(labels).toContain('GET');
    expect(labels).toContain('POST');
    expect(labels).toContain('DELETE');
  });

  it('each group contains only matching method changes', () => {
    const groups = groupByMethod(changes);
    const postGroup = groups.find(g => g.label === 'POST');
    expect(postGroup?.changes).toHaveLength(1);
  });
});

describe('groupByChangeType', () => {
  it('groups by change type', () => {
    const groups = groupByChangeType(changes);
    const labels = groups.map(g => g.label);
    expect(labels).toContain('added');
    expect(labels).toContain('removed');
    expect(labels).toContain('modified');
  });
});

describe('groupChanges', () => {
  it('returns grouped result with total', () => {
    const result = groupChanges(changes, 'type');
    expect(result.total).toBe(changes.length);
    expect(result.strategy).toBe('type');
    expect(result.groups.length).toBeGreaterThan(0);
  });

  it('returns single group for none strategy', () => {
    const result = groupChanges(changes, 'none');
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].label).toBe('all');
  });
});
