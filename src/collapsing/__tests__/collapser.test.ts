import {
  collapsePath,
  collapseChange,
  collapseChanges,
  formatCollapseText,
} from '../collapser';
import { RouteChange } from '../../diff/types';

function makeChange(path: string): RouteChange {
  return { type: 'modified', path, method: 'GET', before: null, after: null };
}

describe('collapsePath', () => {
  it('returns path unchanged when depth is within maxDepth', () => {
    const result = collapsePath('/api/users', { maxDepth: 3 });
    expect(result.wasCollapsed).toBe(false);
    expect(result.collapsed).toBe('/api/users');
    expect(result.depth).toBe(2);
  });

  it('collapses path exceeding maxDepth', () => {
    const result = collapsePath('/api/v1/users/profile/settings', { maxDepth: 3 });
    expect(result.wasCollapsed).toBe(true);
    expect(result.collapsed).toBe('/api/v1/users/...');
  });

  it('normalises express params when collapseParams is true', () => {
    const result = collapsePath('/api/:version/:id/details/extra', { maxDepth: 2, collapseParams: true });
    expect(result.collapsed).toBe('/api/:param/...');
  });

  it('normalises Next.js bracket params', () => {
    const result = collapsePath('/pages/[id]/[slug]/nested/deep', { maxDepth: 2, collapseParams: true });
    expect(result.collapsed).toBe('/pages/[param]/...');
  });

  it('preserves params when collapseParams is false', () => {
    const result = collapsePath('/api/:version/:id/extra/deep', { maxDepth: 2, collapseParams: false });
    expect(result.collapsed).toBe('/api/:version/...');
  });

  it('uses default maxDepth of 3', () => {
    const result = collapsePath('/a/b/c/d');
    expect(result.wasCollapsed).toBe(true);
    expect(result.collapsed).toBe('/a/b/c/...');
  });
});

describe('collapseChange', () => {
  it('attaches collapseResult to the change', () => {
    const change = makeChange('/api/v1/users/profile/settings');
    const result = collapseChange(change, { maxDepth: 2 });
    expect(result.collapseResult).toBeDefined();
    expect(result.collapseResult?.wasCollapsed).toBe(true);
    expect(result.path).toBe('/api/v1/...');
  });

  it('preserves other change fields', () => {
    const change = makeChange('/short/path');
    const result = collapseChange(change, { maxDepth: 3 });
    expect(result.method).toBe('GET');
    expect(result.type).toBe('modified');
  });
});

describe('collapseChanges', () => {
  it('processes all changes', () => {
    const changes = [
      makeChange('/a/b'),
      makeChange('/a/b/c/d/e'),
      makeChange('/x/y/z/w'),
    ];
    const results = collapseChanges(changes, { maxDepth: 2 });
    expect(results).toHaveLength(3);
    expect(results[0].collapseResult?.wasCollapsed).toBe(false);
    expect(results[1].collapseResult?.wasCollapsed).toBe(true);
    expect(results[2].collapseResult?.wasCollapsed).toBe(true);
  });
});

describe('formatCollapseText', () => {
  it('summarises collapsed results', () => {
    const results = [
      { original: '/a/b', collapsed: '/a/b', depth: 2, wasCollapsed: false },
      { original: '/a/b/c/d', collapsed: '/a/b/c/...', depth: 4, wasCollapsed: true },
    ];
    const text = formatCollapseText(results);
    expect(text).toContain('2 path(s) processed, 1 collapsed');
    expect(text).toContain('/a/b/c/d → /a/b/c/...');
  });

  it('uses custom label', () => {
    const results = [{ original: '/x', collapsed: '/x', depth: 1, wasCollapsed: false }];
    const text = formatCollapseText(results, 'MyLabel');
    expect(text).toContain('[MyLabel]');
  });
});
