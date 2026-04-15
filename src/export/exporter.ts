import fs from 'fs';
import path from 'path';
import type { Report } from '../reporters/types';
import { formatAsMarkdown } from '../output/formatter';
import { serialize } from './serializer';
import type { ExportOptions, ExportResult } from './types';

export function exportReport(report: Report, options: ExportOptions): ExportResult {
  let content: string;

  if (options.format === 'markdown') {
    content = formatAsMarkdown(report);
  } else {
    content = serialize(report, options);
  }

  const byteSize = Buffer.byteLength(content, 'utf8');

  if (!options.outputPath) {
    return { format: options.format, content, byteSize };
  }

  const resolvedPath = path.resolve(options.outputPath);
  const dir = path.dirname(resolvedPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(resolvedPath, content, 'utf8');

  return {
    format: options.format,
    content,
    outputPath: resolvedPath,
    writtenAt: new Date(),
    byteSize,
  };
}

export function exportFormats(): string[] {
  return ['json', 'markdown', 'csv', 'html'];
}
