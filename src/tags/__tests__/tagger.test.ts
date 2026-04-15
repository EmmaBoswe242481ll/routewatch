import { RouteInfo } from '../../parsers/types';
import { applyTags, groupByTag, matchesTagRule, resolveTagMeta } from '../tagger';
import { TagConfig } from '../types';

const config: TagConfig = {
  rules: [
    { pattern: '^/api/auth', tags: ['auth'] },
    { pattern: '^/api/users', tags: ['users', 'admin'], methods: ['GET', 'POST'] },
    { pattern: '^/api', tags: ['api'] },
  ],
  tags: {
    auth: { name: 'auth', color: 'blue', description: 'Authentication routes' },
    users: { name: 'users', color: 'green' },
    api: { name: 'api' },
  },
};

const routes: RouteInfo[] = [
  { path: '/api/auth/login', method: 'POST', file: 'pages/api/auth/login.ts', params: [] },
  { path: '/api/users', method: 'GET', file: 'pages/api/users.ts', params: [] },
  { path: '/api/users', method: 'DELETE', file: 'pages/api/users.ts', params: [] },
  { path: '/api/products', method: 'GET', file: 'pages/api/products.ts', params: [] },
];

describe('matchesTagRule', () => {
  it('matches by pattern', () => {
    expect(matchesTagRule(routes[0], config.rules[0])).toBe(true);
  });

  it('respects method filter', () => {
    const rule = config.rules[1];
    expect(matchesTagRule(routes[1], rule)).toBe(true);
    expect(matchesTagRule(routes[2], rule)).toBe(false);
  });

  it('returns false when pattern does not match', () => {
    expect(matchesTagRule({ path: '/health', method: 'GET', params: [] }, config.rules[0])).toBe(false);
  });
});

describe('applyTags', () => {
  it('assigns correct tags to each route', () => {
    const tagged = applyTags(routes, config);
    expect(tagged[0].tags).toContain('auth');
    expect(tagged[0].tags).toContain('api');
    expect(tagged[1].tags).toContain('users');
    expect(tagged[2].tags).not.toContain('users');
    expect(tagged[3].tags).toEqual(['api']);
  });

  it('deduplicates tags', () => {
    const tagged = applyTags([routes[0]], config);
    const unique = new Set(tagged[0].tags);
    expect(unique.size).toBe(tagged[0].tags.length);
  });
});

describe('groupByTag', () => {
  it('groups routes by tag', () => {
    const tagged = applyTags(routes, config);
    const summary = groupByTag(tagged);
    const authGroup = summary.find((s) => s.tag === 'auth');
    expect(authGroup).toBeDefined();
    expect(authGroup!.count).toBe(1);
  });
});

describe('resolveTagMeta', () => {
  it('returns tag metadata when defined', () => {
    const meta = resolveTagMeta('auth', config);
    expect(meta.color).toBe('blue');
    expect(meta.description).toBe('Authentication routes');
  });

  it('returns fallback for unknown tag', () => {
    const meta = resolveTagMeta('unknown', config);
    expect(meta.name).toBe('unknown');
    expect(meta.color).toBeUndefined();
  });
});
