import {
  enrichChange,
  enrichChanges,
  formatEnrichmentText,
  EnrichmentRule,
} from '../enricher';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, method = 'GET', type: RouteChange['type'] = 'added'): RouteChange {
  return {
    type,
    route: { path, method, params: [], framework: 'nextjs', filePath: 'test.ts' },
  } as unknown as RouteChange;
}

describe('enrichChange', () => {
  const rules: EnrichmentRule[] = [
    { pattern: '/api/admin/*', meta: { internal: true, owner: 'platform-team' } },
    { pattern: '/api/v1/*', meta: { tags: ['v1'], addedAt: '2024-01-01' } },
    { pattern: /deprecated/i, meta: { deprecated: true } },
  ];

  it('returns empty meta when no rules match', () => {
    const result = enrichChange(makeChange('/api/unknown'), rules);
    expect(result.meta).toEqual({});
  });

  it('applies matching rule meta', () => {
    const result = enrichChange(makeChange('/api/admin/users'), rules);
    expect(result.meta.internal).toBe(true);
    expect(result.meta.owner).toBe('platform-team');
  });

  it('merges meta from multiple matching rules', () => {
    const multiRules: EnrichmentRule[] = [
      { pattern: '/api/v1/*', meta: { tags: ['v1'] } },
      { pattern: '/api/*', meta: { tags: ['api'], owner: 'core' } },
    ];
    const result = enrichChange(makeChange('/api/v1/orders'), multiRules);
    expect(result.meta.owner).toBe('core');
    expect(result.meta.tags).toContain('v1');
    expect(result.meta.tags).toContain('api');
  });

  it('supports regexp pattern', () => {
    const result = enrichChange(makeChange('/api/deprecated-endpoint'), rules);
    expect(result.meta.deprecated).toBe(true);
  });

  it('preserves the original change reference', () => {
    const change = makeChange('/api/admin/settings');
    const result = enrichChange(change, rules);
    expect(result.change).toBe(change);
  });
});

describe('enrichChanges', () => {
  it('maps over all changes', () => {
    const changes = [makeChange('/api/a'), makeChange('/api/b')];
    const rules: EnrichmentRule[] = [{ pattern: '/api/*', meta: { tags: ['api'] } }];
    const results = enrichChanges(changes, rules);
    expect(results).toHaveLength(2);
    results.forEach((r) => expect(r.meta.tags).toContain('api'));
  });
});

describe('formatEnrichmentText', () => {
  it('returns placeholder for empty list', () => {
    expect(formatEnrichmentText([])).toBe('No enriched changes.');
  });

  it('includes change type, method, and path', () => {
    const change = makeChange('/api/users', 'POST', 'added');
    const enriched = [{ change, meta: { owner: 'team-a', tags: ['public'] } }];
    const text = formatEnrichmentText(enriched);
    expect(text).toContain('ADDED POST /api/users');
    expect(text).toContain('Owner: team-a');
    expect(text).toContain('Tags: public');
  });

  it('omits absent meta fields', () => {
    const change = makeChange('/api/items', 'GET', 'removed');
    const enriched = [{ change, meta: {} }];
    const text = formatEnrichmentText(enriched);
    expect(text).not.toContain('Owner');
    expect(text).not.toContain('Deprecated');
  });
});
