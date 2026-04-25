export interface TraceRule {
  pattern: string;
  label?: string;
}

export interface TracedChange {
  path: string;
  method: string;
  changeType: string;
  traceId: string;
  label?: string;
  tracedAt: string;
}

export interface TraceResult {
  traced: TracedChange[];
  untraced: number;
  totalInput: number;
}

export function buildTraceSummary(result: TraceResult): string {
  return `traced=${result.traced.length} untraced=${result.untraced} total=${result.totalInput}`;
}
