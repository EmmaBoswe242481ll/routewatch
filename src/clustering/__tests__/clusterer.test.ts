import {
  clusterByPrefix,
  clusterByMethod,
  clusterChanges,
  formatClusterText,
} from '../clusterer';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, method = 'GET'): RouteChange {
  return { type: 'modified', path, method, params: [] };
}

describe('clusterByPrefix', () => {
  it('groups changes by first path segment', () => {
    const changes = [makeChange('/api/users'), makeChange('/api/posts'), makeChange('/auth/login')];
    const clusters = clusterByPrefix(changes);
    expect(clusters).toHaveLength(2);
    const api = clusters.find(c => c.label === '/api');
    expect(api?.changes).toHaveLength(2);
  });

  it('handles root path', () => {
    const clusters = clusterByPrefix([makeChange('/')]);
    expect(clusters[0].label).toBe('/');
  });
});

describe('clusterByMethod', () => {
  it('groups changes by HTTP method', () => {
    const changes = [makeChange('/a', 'GET'), makeChange('/b', 'POST'), makeChange('/c', 'GET')];
    const clusters = clusterByMethod(changes);
    const get = clusters.find(c => c.label === 'GET');
    expect(get?.changes).toHaveLength(2);
  });

  it('uses UNKNOWN for missing method', () => {
    const change = { type: 'added' as const, path: '/x', params: [] } as RouteChange;
    const clusters = clusterByMethod([change]);
    expect(clusters[0].label).toBe('UNKNOWN');
  });
});

describe('clusterChanges', () => {
  it('defaults to prefix clustering', () => {
    const changes = [makeChange('/api/a'), makeChange('/v2/b')];
    const clusters = clusterChanges(changes);
    expect(clusters).toHaveLength(2);
  });

  it('uses method clustering when byMethod is set', () => {
    const changes = [makeChange('/a', 'DELETE'), makeChange('/b', 'PUT')];
    const clusters = clusterChanges(changes, { byMethod: true });
    expect(clusters.map(c => c.label)).toContain('DELETE');
  });
});

describe('formatClusterText', () => {
  it('returns no clusters message for empty array', () => {
    expect(formatClusterText([])).toBe('No clusters.');
  });

  it('formats cluster summary', () => {
    const clusters = clusterByPrefix([makeChange('/api/x'), makeChange('/api/y')]);
    const text = formatClusterText(clusters);
    expect(text).toContain('/api');
    expect(text).toContain('2 change(s)');
  });
});
