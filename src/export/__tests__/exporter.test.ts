import fs from 'fs';
import os from 'os';
import path from 'path';
import { exportReport, exportFormats } from '../exporter';
import { serialize } from '../serializer';
import type { Report } from '../../reporters/types';

const mockReport: Report = {
  fromRef: 'abc123',
  toRef: 'def456',
  generatedAt: '2024-01-01T00:00:00.000Z',
  changes: [
    { type: 'added', route: { method: 'GET', path: '/api/users' }, breaking: false },
    { type: 'removed', route: { method: 'DELETE', path: '/api/items/:id' }, breaking: true },
  ],
  summary: { totalRoutes: 10, totalChanges: 2, breaking: 1, added: 1, removed: 1, modified: 0 },
} as unknown as Report;

describe('exportFormats', () => {
  it('returns the expected format list', () => {
    expect(exportFormats()).toEqual(['json', 'markdown', 'csv', 'html']);
  });
});

describe('serialize', () => {
  it('serializes to JSON without metadata by default', () => {
    const result = serialize(mockReport, { format: 'json', pretty: false });
    const parsed = JSON.parse(result);
    expect(parsed.fromRef).toBe('abc123');
    expect(parsed._metadata).toBeUndefined();
  });

  it('includes metadata when requested', () => {
    const result = serialize(mockReport, { format: 'json', pretty: true, includeMetadata: true });
    const parsed = JSON.parse(result);
    expect(parsed._metadata).toBeDefined();
    expect(parsed._metadata.fromRef).toBe('abc123');
    expect(parsed._metadata.totalChanges).toBe(2);
  });

  it('serializes to CSV with header', () => {
    const result = serialize(mockReport, { format: 'csv' });
    const lines = result.split('\n');
    expect(lines[0]).toBe('method,path,changeType,breaking');
    expect(lines[1]).toain('GET');
    expect(lines[2]).toContain('true');
  });

  it('serializes to HTML with table structure', () => {
    const format: 'html' });
    expect(result).toContain('<table>');
    expect(result).toContain('abc123');
    expect(result).toContain('GET');
  throws for markdown format', () => {
    expect(() => serialize(mockReport, { format: 'markdown' })).toThrow();
  });
});

describe('exportReport', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-export-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns content without writing when no outputPath', () => {
    const result = exportReport(mockReport, { format: 'json' });
    expect(result.content).toBeTruthy();
    expect(result.outputPath).toBeUndefined();
    expect(result.byteSize).toBeGreaterThan(0);
  });

  it('writes file to outputPath and returns metadata', () => {
    const outFile = path.join(tmpDir, 'report.json');
    const result = exportReport(mockReport, { format: 'json', outputPath: outFile });
    expect(result.outputPath).toBe(outFile);
    expect(result.writtenAt).toBeInstanceOf(Date);
    expect(fs.existsSync(outFile)).toBe(true);
  });

  it('creates nested directories if they do not exist', () => {
    const outFile = path.join(tmpDir, 'nested', 'deep', 'report.csv');
    exportReport(mockReport, { format: 'csv', outputPath: outFile });
    expect(fs.existsSync(outFile)).toBe(true);
  });

  it('exports markdown format using formatAsMarkdown', () => {
    const result = exportReport(mockReport, { format: 'markdown' });
    expect(result.content).toContain('#');
  });
});
