import { formatReport, formatAsJson, formatAsMarkdown, formatAsText } from '../formatter';
import { DiffReport } from '../../diff/types';

const mockReport: DiffReport = {
  fromRef: 'abc123',
  toRef: 'def456',
  generatedAt: 1700000000000,
  added: [{ method: 'GET', path: '/api/users', params: [], framework: 'nextjs', filePath: 'pages/api/users.ts' }],
  removed: [{ method: 'DELETE', path: '/api/old', params: [], framework: 'nextjs', filePath: 'pages/api/old.ts' }],
  modified: [
    {
      route: { method: 'POST', path: '/api/items', params: ['id'], framework: 'express', filePath: 'routes/items.ts' },
      changes: [{ type: 'added', param: 'slug' }],
    },
  ],
};

describe('formatAsJson', () => {
  it('returns valid JSON string', () => {
    const result = formatAsJson(mockReport);
    expect(() => JSON.parse(result)).not.toThrow();
    const parsed = JSON.parse(result);
    expect(parsed.fromRef).toBe('abc123');
    expect(parsed.added).toHaveLength(1);
  });
});

describe('formatAsMarkdown', () => {
  it('includes section headers for added and removed', () => {
    const result = formatAsMarkdown(mockReport);
    expect(result).toContain('## ✅ Added Routes');
    expect(result).toContain('## ❌ Removed Routes');
    expect(result).toContain('GET /api/users');
    expect(result).toContain('DELETE /api/old');
  });

  it('shows no changes message when empty', () => {
    const empty: DiffReport = { ...mockReport, added: [], removed: [], modified: [] };
    const result = formatAsMarkdown(empty);
    expect(result).toContain('No route changes detected');
  });
});

describe('formatAsText', () => {
  it('includes added and removed routes', () => {
    const result = formatAsText(mockReport);
    expect(result).toContain('ADDED');
    expect(result).toContain('REMOVED');
    expect(result).toContain('+ GET /api/users');
    expect(result).toContain('- DELETE /api/old');
  });

  it('includes modified route details', () => {
    const result = formatAsText(mockReport);
    expect(result).toContain('MODIFIED');
    expect(result).toContain('~ POST /api/items');
    expect(result).toContain('[added] slug');
  });
});

describe('formatReport', () => {
  it('delegates to correct formatter based on format option', () => {
    const json = formatReport(mockReport, { format: 'json' });
    expect(json.startsWith('{')).toBe(true);

    const md = formatReport(mockReport, { format: 'markdown' });
    expect(md).toContain('# Route Diff Report');

    const text = formatReport(mockReport, { format: 'text' });
    expect(text).toContain('Route Diff:');
  });

  it('throws on unknown format', () => {
    expect(() => formatReport(mockReport, { format: 'xml' as any })).toThrow('Unknown format');
  });
});
