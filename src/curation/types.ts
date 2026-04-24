export interface CurationRule {
  pattern: string;
  action: 'include' | 'exclude' | 'promote' | 'demote';
  reason?: string;
  priority?: number;
}

export interface CurationConfig {
  rules: CurationRule[];
  defaultAction?: 'include' | 'exclude';
}

export interface CuratedChange {
  path: string;
  method: string;
  changeType: string;
  action: 'include' | 'exclude' | 'promote' | 'demote';
  matchedRule?: CurationRule;
  reason?: string;
}

export interface CurationResult {
  included: CuratedChange[];
  excluded: CuratedChange[];
  promoted: CuratedChange[];
  demoted: CuratedChange[];
  total: number;
}

export function buildCurationSummary(result: CurationResult): string {
  return [
    `total=${result.total}`,
    `included=${result.included.length}`,
    `excluded=${result.excluded.length}`,
    `promoted=${result.promoted.length}`,
    `demoted=${result.demoted.length}`,
  ].join(' ');
}
