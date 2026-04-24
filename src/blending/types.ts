export interface BlendRule {
  pattern: string;
  weight: number;
  strategy: 'merge' | 'override' | 'average';
}

export interface BlendConfig {
  rules: BlendRule[];
  defaultWeight?: number;
  defaultStrategy?: 'merge' | 'override' | 'average';
}

export interface BlendedChange {
  path: string;
  method: string;
  changeType: string;
  weight: number;
  strategy: 'merge' | 'override' | 'average';
  sources: string[];
  blendedScore: number;
}

export interface BlendResult {
  changes: BlendedChange[];
  totalBlended: number;
  strategyCounts: Record<string, number>;
}

export function buildBlendSummary(result: BlendResult): string {
  const lines: string[] = [
    `Total blended: ${result.totalBlended}`,
  ];
  for (const [strategy, count] of Object.entries(result.strategyCounts)) {
    lines.push(`  ${strategy}: ${count}`);
  }
  return lines.join('\n');
}
