import { curateChanges, formatCurationText } from '../curator';
import { buildCurationSummary, CurationConfig } from '../types';

function makeChange(path: string, method = 'GET', changeType = 'added') {
  return { path, method, changeType };
}

const baseConfig: CurationConfig = {
  rules: [],
  defaultAction: 'include',
};

describe('curateChanges', () => {
  it('includes all changes by default', () => {
    const changes = [makeChange('/api/users'), makeChange('/api/posts')];
    const result = curateChanges(changes, baseConfig);
    expect(result.included).toHaveLength(2);
    expect(result.excluded).toHaveLength(0);
    expect(result.total).toBe(2);
  });

  it('excludes changes matching an exclude rule', () => {
    const config: CurationConfig = {
      rules: [{ pattern: '/internal/*', action: 'exclude', reason: 'internal only' }],
      defaultAction: 'include',
    };
    const changes = [makeChange('/api/users'), makeChange('/internal/health')];
    const result = curateChanges(changes, config);
    expect(result.included).toHaveLength(1);
    expect(result.excluded).toHaveLength(1);
    expect(result.excluded[0].reason).toBe('internal only');
  });

  it('promotes changes matching a promote rule', () => {
    const config: CurationConfig = {
      rules: [{ pattern: '/api/v2/*', action: 'promote', priority: 10 }],
      defaultAction: 'include',
    };
    const changes = [makeChange('/api/v2/users'), makeChange('/api/v1/users')];
    const result = curateChanges(changes, config);
    expect(result.promoted).toHaveLength(1);
    expect(result.included).toHaveLength(1);
  });

  it('respects rule priority ordering', () => {
    const config: CurationConfig = {
      rules: [
        { pattern: '/api/*', action: 'include', priority: 1 },
        { pattern: '/api/secret', action: 'exclude', priority: 5 },
      ],
      defaultAction: 'include',
    };
    const changes = [makeChange('/api/secret')];
    const result = curateChanges(changes, config);
    expect(result.excluded).toHaveLength(1);
  });

  it('demotes changes matching a demote rule', () => {
    const config: CurationConfig = {
      rules: [{ pattern: '/legacy/*', action: 'demote' }],
    };
    const changes = [makeChange('/legacy/endpoint')];
    const result = curateChanges(changes, config);
    expect(result.demoted).toHaveLength(1);
  });

  it('uses exclude as default action when configured', () => {
    const config: CurationConfig = { rules: [], defaultAction: 'exclude' };
    const changes = [makeChange('/api/users')];
    const result = curateChanges(changes, config);
    expect(result.excluded).toHaveLength(1);
    expect(result.included).toHaveLength(0);
  });
});

describe('formatCurationText', () => {
  it('formats result as readable text', () => {
    const changes = [makeChange('/a'), makeChange('/b')];
    const result = curateChanges(changes, baseConfig);
    const text = formatCurationText(result);
    expect(text).toContain('Curation Result');
    expect(text).toContain('Included: 2');
  });
});

describe('buildCurationSummary', () => {
  it('returns a compact summary string', () => {
    const changes = [makeChange('/a')];
    const result = curateChanges(changes, baseConfig);
    const summary = buildCurationSummary(result);
    expect(summary).toContain('total=1');
    expect(summary).toContain('included=1');
  });
});
