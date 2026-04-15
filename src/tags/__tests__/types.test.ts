import { TagConfig, TaggedRoute, TagRule, TagSummary } from '../types';

describe('Tag types shape', () => {
  it('TagRule accepts pattern and tags', () => {
    const rule: TagRule = { pattern: '^/api', tags: ['api'] };
    expect(rule.pattern).toBe('^/api');
    expect(rule.tags).toContain('api');
  });

  it('TagRule accepts optional methods', () => {
    const rule: TagRule = { pattern: '^/api', tags: ['api'], methods: ['GET'] };
    expect(rule.methods).toEqual(['GET']);
  });

  it('TagConfig holds rules and tag definitions', () => {
    const config: TagConfig = {
      rules: [{ pattern: '^/api', tags: ['api'] }],
      tags: { api: { name: 'api', color: 'red' } },
    };
    expect(config.rules).toHaveLength(1);
    expect(config.tags['api'].color).toBe('red');
  });

  it('TaggedRoute holds path method and tags', () => {
    const route: TaggedRoute = { path: '/api/users', method: 'GET', tags: ['api', 'users'] };
    expect(route.tags).toHaveLength(2);
  });

  it('TagSummary aggregates by tag', () => {
    const summary: TagSummary = {
      tag: 'api',
      count: 2,
      routes: [
        { path: '/api/a', method: 'GET', tags: ['api'] },
        { path: '/api/b', method: 'POST', tags: ['api'] },
      ],
    };
    expect(summary.count).toBe(2);
    expect(summary.routes).toHaveLength(2);
  });
});
