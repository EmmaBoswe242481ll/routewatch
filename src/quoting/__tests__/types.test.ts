import { buildQuoteSummary, dominantTemplate } from '../types';
import { QuotedChange } from '../quoter';
import { RouteChange } from '../../diff/types';

function makeQuoted(path: string, template: string, type: 'added' | 'removed' | 'modified' = 'added'): QuotedChange {
  const change: RouteChange = { path, method: 'GET', type, before: null, after: null };
  return { change, quote: `${template}: ${path}`, template };
}

describe('buildQuoteSummary', () => {
  it('returns zero totals for empty array', () => {
    const summary = buildQuoteSummary([]);
    expect(summary.total).toBe(0);
    expect(summary.byTemplate).toEqual({});
    expect(summary.byType).toEqual({});
  });

  it('counts by template and type', () => {
    const quoted = [
      makeQuoted('/api/a', 'API: {path}', 'added'),
      makeQuoted('/api/b', 'API: {path}', 'removed'),
      makeQuoted('/other', 'DEFAULT', 'added'),
    ];
    const summary = buildQuoteSummary(quoted);
    expect(summary.total).toBe(3);
    expect(summary.byTemplate['API: {path}']).toBe(2);
    expect(summary.byTemplate['DEFAULT']).toBe(1);
    expect(summary.byType['added']).toBe(2);
    expect(summary.byType['removed']).toBe(1);
  });
});

describe('dominantTemplate', () => {
  it('returns null for empty summary', () => {
    expect(dominantTemplate({ total: 0, byTemplate: {}, byType: {} })).toBeNull();
  });

  it('returns the template with highest count', () => {
    const summary = buildQuoteSummary([
      makeQuoted('/a', 'T1'),
      makeQuoted('/b', 'T1'),
      makeQuoted('/c', 'T2'),
    ]);
    expect(dominantTemplate(summary)).toBe('T1');
  });
});
