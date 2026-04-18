export interface LabelSummary {
  totalLabels: number;
  unlabeledCount: number;
  labelCounts: Record<string, number>;
}

export function buildLabelSummary(
  grouped: Record<string, import('./labeler').LabeledChange[]>
): LabelSummary {
  const labelCounts: Record<string, number> = {};
  let unlabeledCount = 0;
  for (const [label, items] of Object.entries(grouped)) {
    if (label === 'unlabeled') {
      unlabeledCount = items.length;
    } else {
      labelCounts[label] = items.length;
    }
  }
  return {
    totalLabels: Object.keys(labelCounts).length,
    unlabeledCount,
    labelCounts,
  };
}

/**
 * Returns the label with the highest number of associated changes.
 * Returns null if there are no labeled changes.
 */
export function dominantLabel(summary: LabelSummary): string | null {
  const entries = Object.entries(summary.labelCounts);
  if (entries.length === 0) return null;
  return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}
