import * as fs from 'fs';
import * as path from 'path';
import { FormattedReport } from './formatter';

export function resolveOutputPath(outputDir: string, filename: string): string {
  return path.resolve(outputDir, filename);
}

export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export interface WriteOptions {
  outputDir: string;
  filename: string;
  overwrite?: boolean;
}

export function writeReport(report: FormattedReport, options: WriteOptions): string {
  const { outputDir, filename, overwrite = true } = options;

  ensureDir(outputDir);

  const outputPath = resolveOutputPath(outputDir, filename);

  if (!overwrite && fs.existsSync(outputPath)) {
    throw new Error(`File already exists at ${outputPath}. Use overwrite: true to replace it.`);
  }

  fs.writeFileSync(outputPath, report.content, 'utf-8');

  return outputPath;
}

export function writeReportToStdout(report: FormattedReport): void {
  process.stdout.write(report.content + '\n');
}

export function generateFilename(fromRef: string, toRef: string, format: string): string {
  const sanitize = (ref: string) => ref.replace(/[^a-zA-Z0-9_-]/g, '_');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `routewatch-${sanitize(fromRef)}-${sanitize(toRef)}-${timestamp}.${format}`;
}
