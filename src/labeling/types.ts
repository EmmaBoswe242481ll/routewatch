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
