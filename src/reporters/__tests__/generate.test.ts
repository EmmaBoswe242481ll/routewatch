import { generateReport, renderReport } from '../generate';
import type { RouteDiff } from '../../diff/types';

const mockDiffs: RouteDiff[] = [
  {
    type: 'added',
    route: { method: 'GET', path: '/api/users', params: [] },
  },
  {
    type: 'removed',
    route: { method: 'DELETE', path: '/api/legacy', params: [] },
  },
  {
    type: 'modified',
    route: { method: 'POST', path: '/api/posts', params: [] },
    changes: ['params changed'],
  },
];

describe('generateReport', () => {
  it('should produce correct summary counts', () => {
    const report = generateReport(mockDiffs, 'abc123', 'def456', { format: 'json' });
    expect(report.summary.added).toBe(1);
    expect(report.summary.removed).toBe(1);
    expect(report.summary.modified).toBe(1);
    expect(report.summary.total).toBe(3);
  });

  it('should set fromRef and toRef correctly', () => {
    const report = generateReport(mockDiffs, 'abc123', 'def456', { format: 'json' });
    expect(report.fromRef).toBe('abc123');
    expect(report.toRef).toBe('def456');
  });

  it('should use custom title when provided', () => {
    const report = generateReport(mockDiffs, 'a', 'b', { format: 'json', title: 'My Report' });
    expect(report.title).toBe('My Report');
  });

  it('should build sections for each diff type present', () => {
    const report = generateReport(mockDiffs, 'a', 'b', { format: 'text' });
    const headings = report.sections.map((s) => s.heading);
    expect(headings).toContain('Added Routes');
    expect(headings).toContain('Removed Routes');
    expect(headings).toContain('Modified Routes');
  });

  it('should omit sections for diff types with no entries', () => {
    const onlyAdded: RouteDiff[] = [
      { type: 'added', route: { method: 'GET', path: '/new', params: [] } },
    ];
    const report = generateReport(onlyAdded, 'a', 'b', { format: 'text' });
    const headings = report.sections.map((s) => s.heading);
    expect(headings).not.toContain('Removed Routes');
  });
});

describe('renderReport', () => {
  const report = generateReport(mockDiffs, 'abc', 'def', { format: 'json' });

  it('should render valid JSON for json format', () => {
    const output = renderReport(report, 'json');
    expect(() => JSON.parse(output)).not.toThrow();
    const parsed = JSON.parse(output);
    expect(parsed.summary.added).toBe(1);
  });

  it('should render markdown with headings', () => {
    const output = renderReport(report, 'markdown');
    expect(output).toContain('# ');
    expect(output).toContain('## Summary');
    expect(output).toContain('## Added Routes');
  });

  it('should render plain text output', () => {
    const output = renderReport(report, 'text');
    expect(output).toContain('Summary:');
    expect(output).toContain('Added Routes');
  });
});
