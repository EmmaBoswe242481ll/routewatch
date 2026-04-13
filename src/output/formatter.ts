import { DiffReport } from '../diff/types';

export type OutputFormat = 'json' | 'markdown' | 'text';

export interface FormatOptions {
  format: OutputFormat;
  color?: boolean;
  verbose?: boolean;
}

export function formatAsJson(report: DiffReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatAsMarkdown(report: DiffReport): string {
  const lines: string[] = [];
  lines.push(`# Route Diff Report`);
  lines.push(``);
  lines.push(`**From:** \`${report.fromRef}\` → **To:** \`${report.toRef}\``);
  lines.push(`**Generated:** ${new Date(report.generatedAt).toISOString()}`);
  lines.push(``);

  if (report.added.length > 0) {
    lines.push(`## ✅ Added Routes (${report.added.length})`);
    for (const route of report.added) {
      lines.push(`- \`${route.method} ${route.path}\``);
    }
    lines.push(``);
  }

  if (report.removed.length > 0) {
    lines.push(`## ❌ Removed Routes (${report.removed.length})`);
    for (const route of report.removed) {
      lines.push(`- \`${route.method} ${route.path}\``);
    }
    lines.push(``);
  }

  if (report.modified.length > 0) {
    lines.push(`## ✏️ Modified Routes (${report.modified.length})`);
    for (const change of report.modified) {
      lines.push(`- \`${change.route.method} ${change.route.path}\``);
      for (const c of change.changes) {
        lines.push(`  - ${c.type}: \`${c.param}\``);
      }
    }
    lines.push(``);
  }

  if (report.added.length === 0 && report.removed.length === 0 && report.modified.length === 0) {
    lines.push(`_No route changes detected._`);
  }

  return lines.join('\n');
}

export function formatAsText(report: DiffReport): string {
  const lines: string[] = [];
  lines.push(`Route Diff: ${report.fromRef} -> ${report.toRef}`);
  lines.push(`Generated: ${new Date(report.generatedAt).toISOString()}`);
  lines.push('');

  if (report.added.length > 0) {
    lines.push(`ADDED (${report.added.length}):`);
    report.added.forEach(r => lines.push(`  + ${r.method} ${r.path}`));
    lines.push('');
  }
  if (report.removed.length > 0) {
    lines.push(`REMOVED (${report.removed.length}):`);
    report.removed.forEach(r => lines.push(`  - ${r.method} ${r.path}`));
    lines.push('');
  }
  if (report.modified.length > 0) {
    lines.push(`MODIFIED (${report.modified.length}):`);
    report.modified.forEach(c => {
      lines.push(`  ~ ${c.route.method} ${c.route.path}`);
      c.changes.forEach(ch => lines.push(`    [${ch.type}] ${ch.param}`));
    });
  }

  return lines.join('\n');
}

export function formatReport(report: DiffReport, options: FormatOptions): string {
  switch (options.format) {
    case 'json': return formatAsJson(report);
    case 'markdown': return formatAsMarkdown(report);
    case 'text': return formatAsText(report);
    default: throw new Error(`Unknown format: ${options.format}`);
  }
}
