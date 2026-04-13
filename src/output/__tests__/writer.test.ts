import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  resolveOutputPath,
  ensureDir,
  writeReport,
  writeReportToStdout,
  generateFilename,
} from '../writer';
import { FormattedReport } from '../formatter';

const makeTempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-writer-'));

const mockReport = (content: string, format: string = 'text'): FormattedReport => ({
  content,
  format: format as FormattedReport['format'],
});

describe('resolveOutputPath', () => {
  it('resolves an absolute path from dir and filename', () => {
    const result = resolveOutputPath('/tmp/reports', 'report.txt');
    expect(result).toBe(path.resolve('/tmp/reports', 'report.txt'));
  });
});

describe('ensureDir', () => {
  it('creates directory if it does not exist', () => {
    const tmpDir = makeTempDir();
    const newDir = path.join(tmpDir, 'nested', 'dir');
    ensureDir(newDir);
    expect(fs.existsSync(newDir)).toBe(true);
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('does not throw if directory already exists', () => {
    const tmpDir = makeTempDir();
    expect(() => ensureDir(tmpDir)).not.toThrow();
    fs.rmSync(tmpDir, { recursive: true });
  });
});

describe('writeReport', () => {
  it('writes report content to file', () => {
    const tmpDir = makeTempDir();
    const report = mockReport('hello world');
    const outPath = writeReport(report, { outputDir: tmpDir, filename: 'out.txt' });
    expect(fs.readFileSync(outPath, 'utf-8')).toBe('hello world');
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('throws if file exists and overwrite is false', () => {
    const tmpDir = makeTempDir();
    const report = mockReport('content');
    writeReport(report, { outputDir: tmpDir, filename: 'out.txt' });
    expect(() =>
      writeReport(report, { outputDir: tmpDir, filename: 'out.txt', overwrite: false })
    ).toThrow(/already exists/);
    fs.rmSync(tmpDir, { recursive: true });
  });
});

describe('writeReportToStdout', () => {
  it('writes content to stdout', () => {
    const spy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    writeReportToStdout(mockReport('stdout content'));
    expect(spy).toHaveBeenCalledWith('stdout content\n');
    spy.mockRestore();
  });
});

describe('generateFilename', () => {
  it('generates a filename with sanitized refs and format extension', () => {
    const name = generateFilename('main', 'feature/my-branch', 'json');
    expect(name).toMatch(/^routewatch-main-feature_my-branch-.*\.json$/);
  });

  it('sanitizes special characters in refs', () => {
    const name = generateFilename('v1.0.0', 'HEAD~1', 'md');
    expect(name).toMatch(/^routewatch-v1_0_0-HEAD_1-.*\.md$/);
  });
});
