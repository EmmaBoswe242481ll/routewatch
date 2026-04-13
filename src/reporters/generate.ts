import type { RouteDiff } from '../diff/types';
import type { Report, ReportOptions, ReportSection } from './types';

export function generateReport(
  diffs: RouteDiff[],
  fromRef: string,
  toRef: string,
  options: ReportOptions
): Report {
  const added = diffs.filter((d) => d.type === 'added');
  const removed = diffs.filter((d) => d.type === 'removed');
  const modified = diffs.filter((d) => d.type === 'modified');

  const sections: ReportSection[] = [];

  if (added.length > 0) {
    sections.push({
      heading: 'Added Routes',
      items: added.map((d) => `${d.route.method} ${d.route.path}`),
    });
  }

  if (removed.length > 0) {
    sections.push({
      heading: 'Removed Routes',
      items: removed.map((d) => `${d.route.method} ${d.route.path}`),
    });
  }

  if (modified.length > 0) {
    sections.push({
      heading: 'Modified Routes',
      items: modified.map((d) => {
        const changes = d.changes?.join(', ') ?? 'unknown changes';
        return `${d.route.method} ${d.route.path} (${changes})`;
      }),
    });
  }

  return {
    title: options.title ?? `Route Diff: ${fromRef}..${toRef}`,
    generatedAt: new Date().toISOString(),
    fromRef,
    toRef,
    summary: {
      added: added.length,
      removed: removed.length,
      modified: modified.length,
      total: diffs.length,
    },
    sections,
    raw: diffs,
  };
}

export function renderReport(report: Report, format: ReportOptions['format']): string {
  if (format === 'json') {
    return JSON.stringify(report, null, 2);
  }

  if (format === 'markdown') {
    const lines: string[] = [
      `# ${report.title}`,
      ``,
      `**Generated:** ${report.generatedAt}`,
      `**Comparing:** \`${report.fromRef}\` → \`${report.toRef}\``,
      ``,
      `## Summary`,
      ``,
      `| Added | Removed | Modified | Total |`,
      `|-------|---------|----------|-------|`,
      `| ${report.summary.added} | ${report.summary.removed} | ${report.summary.modified} | ${report.summary.total} |`,
      ``,
    ];

    for (const section of report.sections) {
      lines.push(`## ${section.heading}`, ``);
      for (const item of section.items) {
        lines.push(`- \`${item}\``);
      }
      lines.push(``);
    }

    return lines.join('\n');
  }

  // text format
  const lines: string[] = [
    report.title,
    '='.repeat(report.title.length),
    `Generated: ${report.generatedAt}`,
    `Comparing: ${report.fromRef} -> ${report.toRef}`,
    '',
    `Summary: +${report.summary.added} -${report.summary.removed} ~${report.summary.modified}`,
    '',
  ];

  for (const section of report.sections) {
    lines.push(section.heading, '-'.repeat(section.heading.length));
    for (const item of section.items) {
      lines.push(`  ${item}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
