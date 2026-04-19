import { QuotedChange } from './quoter';

export interface QuoteSummary {
  total: number;
  byTemplate: Record<string, number>;
  byType: Record<string, number>;
}

export function buildQuoteSummary(quoted: QuotedChange[]): QuoteSummary {
  const byTemplate: Record<string, number> = {};
  const byType: Record<string, number> = {};

  for (const q of quoted) {
    byTemplate[q.template] = (byTemplate[q.template] ?? 0) + 1;
    byType[q.change.type] = (byType[q.change.type] ?? 0) + 1;
  }

  return { total: quoted.length, byTemplate, byType };
}

export function dominantTemplate(summary: QuoteSummary): string | null {
  const entries = Object.entries(summary.byTemplate);
  if (entries.length === 0) return null;
  return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}
