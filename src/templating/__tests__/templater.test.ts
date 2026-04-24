import { templateChange, templateChanges, formatTemplateText } from '../templater';
import type { TemplateConfig } from '../types';
import type { RouteChange } from '../../diff/types';

function makeChange(overrides: Partial<RouteChange> = {}): RouteChange {
  return {
    path: '/api/users',
    method: 'GET',
    type: 'added',
    ...overrides,
  } as RouteChange;
}

const config: TemplateConfig = {
  rules: [
    {
      pattern: '/api/users*',
      template: 'User route {{method}} {{path}} was {{type}}',
      variables: { team: 'backend' },
    },
    {
      pattern: '/api/posts*',
      template: 'Post route {{method}} {{path}}',
    },
  ],
  fallback: 'Route {{method}} {{path}} changed ({{type}})',
};

describe('templateChange', () => {
  it('applies a matching rule', () => {
    const result = templateChange(makeChange(), config);
    expect(result.rendered).toBe('User route GET /api/users was added');
    expect(result.rule).toBe('/api/users*');
  });

  it('uses fallback when no rule matches', () => {
    const result = templateChange(makeChange({ path: '/health' }), config);
    expect(result.rendered).toBe('Route GET /health changed (added)');
    expect(result.rule).toBeUndefined();
  });

  it('handles modified changes with before path', () => {
    const change = makeChange({
      path: '/api/users/:id',
      type: 'modified',
      before: { path: '/api/users/:userId', method: 'GET' } as any,
    });
    const result = templateChange(change, config);
    expect(result.rendered).toContain('/api/users/:id');
  });

  it('keeps unresolved placeholders when variable missing', () => {
    const cfg: TemplateConfig = { rules: [{ pattern: '/x', template: '{{missing}}' }] };
    const result = templateChange(makeChange({ path: '/x' }), cfg);
    expect(result.rendered).toBe('{{missing}}');
  });
});

describe('templateChanges', () => {
  it('returns a result with correct matched/unmatched counts', () => {
    const changes = [
      makeChange({ path: '/api/users' }),
      makeChange({ path: '/health' }),
      makeChange({ path: '/api/posts/1' }),
    ];
    const result = templateChanges(changes, config);
    expect(result.changes).toHaveLength(3);
    expect(result.matched).toBe(2);
    expect(result.unmatched).toBe(1);
  });

  it('returns empty result for no changes', () => {
    const result = templateChanges([], config);
    expect(result.changes).toHaveLength(0);
    expect(result.matched).toBe(0);
    expect(result.unmatched).toBe(0);
  });
});

describe('formatTemplateText', () => {
  it('formats result as readable text', () => {
    const result = templateChanges([makeChange()], config);
    const text = formatTemplateText(result);
    expect(text).toContain('Templated 1 change(s)');
    expect(text).toContain('User route GET /api/users was added');
  });
});
