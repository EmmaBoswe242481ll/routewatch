import { buildSummary, formatSummaryText } from '../builder';
import { RouteDiff } from '../../diff/types';

const makeDiff = (type: RouteDiff['type'], method = 'GET', framework = 'nextjs'): RouteDiff => {
  const route = { path: '/api/test', method, framework, params: [] };
  return {
    type,
    route: type !== 'removed' ? route : undefined,
    before: type === 'removed' ? route : undefined,
    after: undefined,
    paramChanges: type === 'modified' ? [{ name: 'id', changeType: 'removed' }] : [],
  } as unknown as RouteDiff;
};

describe('buildSummary', () => {
  it('counts route types correctly', () => {
    const diffs: RouteDiff[] = [
      makeDiff('added'),
      makeDiff('removed'),
      makeDiff('modified'),
      makeDiff('unchanged'),
    ];
    const result = buildSummary(diffs, 'abc123', 'def456');
    expect(result.summary.totalRoutes).toBe(4);
    expect(result.summary.addedRoutes).toBe(1);
    expect(result.summary.removedRoutes).toBe(1);
    expect(result.summary.modifiedRoutes).toBe(1);
    expect(result.summary.unchangedRoutes).toBe(1);
  });

  it('counts breaking changes for removed and modified with param changes', () => {
    const diffs: RouteDiff[] = [makeDiff('removed'), makeDiff('modified')];
    const result = buildSummary(diffs, 'a', 'b');
    expect(result.summary.breakingChanges).toBe(2);
  });

  it('groups by method when option is set', () => {
    const diffs: RouteDiff[] = [makeDiff('added', 'GET'), makeDiff('added', 'POST')];
    const result = buildSummary(diffs, 'a', 'b', { groupByMethod: true });
    expect(result.summary.byMethod['GET']).toBe(1);
    expect(result.summary.byMethod['POST']).toBe(1);
  });

  it('groups by framework when option is set', () => {
    const diffs: RouteDiff[] = [makeDiff('added', 'GET', 'express'), makeDiff('added', 'GET', 'nextjs')];
    const result = buildSummary(diffs, 'a', 'b', { groupByFramework: true });
    expect(result.summary.byFramework['express']).toBe(1);
    expect(result.summary.byFramework['nextjs']).toBe(1);
  });

  it('includes fromRef, toRef and generatedAt', () => {
    const result = buildSummary([], 'abc', 'def');
    expect(result.fromRef).toBe('abc');
    expect(result.toRef).toBe('def');
    expect(result.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('formatSummaryText', () => {
  it('renders summary as readable text', () => {
    const result = buildSummary([makeDiff('added'), makeDiff('removed')], 'abc', 'def');
    const text = formatSummaryText(result);
    expect(text).toContain('abc..def');
    expect(text).toContain('Added      : 1');
    expect(text).toContain('Removed    : 1');
    expect(text).toContain('Breaking     : 1');
  });

  it('includes method breakdown when present', () => {
    const result = buildSummary([makeDiff('added', 'DELETE')], 'a', 'b', { groupByMethod: true });
    const text = formatSummaryText(result);
    expect(text).toContain('By Method:');
    expect(text).toContain('DELETE');
  });
});
