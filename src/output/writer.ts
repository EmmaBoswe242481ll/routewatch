import fs from 'fs';
import path from 'path';
import { DiffReport } from '../diff/types';
import { formatReport, FormatOptions, OutputFormat } from './formatter';

export interface WriteOptions extends FormatOptions {
  outputPath?: string;
  stdout?: boolean;
}

export function resolveOutputPath(
  outputPath: string | undefined,
  format: OutputFormat
): string | undefined {
  if (!outputPath) return undefined;
  const ext = path.extname(outputPath);
  if (ext) return outputPath;
  const extMap: Record<OutputFormat, string> = {
    json: '.json',
    markdown: '.md',
    text: '.txt',
  };
  return `${outputPath}${extMap[format]}`;
}

export function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function writeReport(
  report: DiffReport,
  options: WriteOptions
): Promise<string | null> {
  const formatted = formatReport(report, options);

  if (options.stdout || !options.outputPath) {
    process.stdout.write(formatted + '\n');
    return null;
  }

  const resolvedPath = resolveOutputPath(options.outputPath, options.format);
  if (!resolvedPath) {
    process.stdout.write(formatted + '\n');
    return null;
  }

  ensureDir(resolvedPath);
  fs.writeFileSync(resolvedPath, formatted, 'utf-8');
  return resolvedPath;
}
