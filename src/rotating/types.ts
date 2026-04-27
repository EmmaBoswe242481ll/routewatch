export interface RotateRule {
  pattern: string;
  shift: number; // number of positions to rotate
}

export interface RotateConfig {
  rules: RotateRule[];
  defaultShift?: number;
}

export interface RotatedChange {
  original: string;
  rotated: string;
  method: string;
  changeType: string;
  shift: number;
  ruleMatched?: string;
}

export interface RotateSummary {
  total: number;
  rotated: number;
  unchanged: number;
}

export function buildRotateSummary(changes: RotatedChange[]): RotateSummary {
  const rotated = changes.filter(c => c.original !== c.rotated).length;
  return {
    total: changes.length,
    rotated,
    unchanged: changes.length - rotated,
  };
}
