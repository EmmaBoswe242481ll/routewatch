import type { CommitRange, CompareOptions, CompareResult } from '../types';

describe('CompareOptions type', () => {
  it('accepts valid CommitRange', () => {
    const range: CommitRange = { from: 'abc123', to: 'def456' };
    expect(range.from).toBe('abc123');
    expect(range.to).toBe('def456');
  });

  it('accepts minimal CompareOptions', () => {
    const opts: CompareOptions = {
      range: { from: 'a', to: 'b' },
    };
    expect(opts.range).toBeDefined();
    expect(opts.framework).toBeUndefined();
    expect(opts.filters).toBeUndefined();
    expect(opts.useCache).toBeUndefined();
  });

  it('accepts full CompareOptions', () => {
    const opts: CompareOptions = {
      range: { from: 'a', to: 'b' },
      framework: 'nextjs',
      filters: { methods: ['GET', 'POST'], patterns: ['/api/*'] },
      useCache: true,
    };
    expect(opts.framework).toBe('nextjs');
    expect(opts.filters?.methods).toHaveLength(2);
    expect(opts.filters?.patterns).toContain('/api/*');
  });

  it('accepts express framework option', () => {
    const opts: CompareOptions = {
      range: { from: 'a', to: 'b' },
      framework: 'express',
    };
    expect(opts.framework).toBe('express');
  });
});
