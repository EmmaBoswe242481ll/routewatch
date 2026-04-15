import type { Report } from '../reporters/types';
import type { ExportFormat, ExportMetadata, ExportOptions } from './types';

const TOOL_VERSION = '1.0.0';

function buildMetadata(report: Report): ExportMetadata {
  return {
    generatedAt: new Date().toISOString(),
    toolVersion: TOOL_VERSION,
    fromRef: report.fromRef,
    toRef: report.toRef,
    totalRoutes: report.summary?.totalRoutes ?? 0,
    totalChanges: report.changes.length,
  };
}

function serializeToJson(report: Report, options: ExportOptions): string {
  const payload: Record<string, unknown> = { ...report };
  if (options.includeMetadata) {
    payload._metadata = buildMetadata(report);
  }
  return options.pretty ? JSON.stringify(payload, null, 2) : JSON.stringify(payload);
}

function serializeToCsv(report: Report): string {
  const header = 'method,path,changeType,breaking';
  const rows = report.changes.map((c) => {
    const method = c.route?.method ?? '';
    const path = c.route?.path ?? '';
    const changeType = c.type;
    const breaking = c.breaking ? 'true' : 'false';
    return `${method},${path},${changeType},${breaking}`;
  });
  return [header, ...rows].join('\n');
}

function serializeToHtml(report: Report, options: ExportOptions): string {
  const meta = options.includeMetadata ? buildMetadata(report) : null;
  const rows = report.changes
    .map(
      (c) =>
        `<tr><td>${c.route?.method ?? ''}</td><td>${c.route?.path ?? ''}</td>` +
        `<td>${c.type}</td><td>${c.breaking ? 'yes' : 'no'}</td></tr>`
    )
    .join('\n');
  const metaSection = meta
    ? `<p class="meta">Generated: ${meta.generatedAt} | Version: ${meta.toolVersion}</p>`
    : '';
  return `<!DOCTYPE html><html><head><title>RouteWatch Report</title></head><body>
${metaSection}
<h1>Route Diff: ${report.fromRef} → ${report.toRef}</h1>
<table><thead><tr><th>Method</th><th>Path</th><th>Change</th><th>Breaking</th></tr></thead>
<tbody>${rows}</tbody></table></body></html>`;
}

export function serialize(report: Report, options: ExportOptions): string {
  switch (options.format) {
    case 'json':
      return serializeToJson(report, options);
    case 'csv':
      return serializeToCsv(report);
    case 'html':
      return serializeToHtml(report, options);
    case 'markdown':
      throw new Error('Use the existing formatAsMarkdown from output/formatter for markdown export');
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}
