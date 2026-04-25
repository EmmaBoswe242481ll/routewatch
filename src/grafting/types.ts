export interface GraftRule {
  sourcePattern: string;
  targetPattern: string;
  method?: string;
  transform?: (path: string) => string;
}

export interface GraftedChange {
  original: string;
  grafted: string;
  method: string;
  ruleIndex: number;
  transformed: boolean;
}

export interface GraftResult {
  changes: GraftedChange[];
  ungrafted: number;
  totalRules: number;
}

export function buildGraftSummary(result: GraftResult): string {
  const grafted = result.changes.filter((c) => c.transformed).length;
  return `grafted=${grafted} ungrafted=${result.ungrafted} rules=${result.totalRules}`;
}
