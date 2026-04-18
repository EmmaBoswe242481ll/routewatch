export type { FlagRule, FlaggedChange, FlagResult } from './flagger';

export interface FlagSummary {
  totalFlagged: number;
  totalClean: number;
  totalFlags: number;
  flagCounts: Record<string, number>;
}

export function buildFlagSummary(flagCounts: Record<string, number>, totalClean: number): FlagSummary {
  const totalFlagged = Object.values(flagCounts).reduce((s, v) => s + (v > 0 ? 1 : 0), 0);
  const totalFlags = Object.values(flagCounts).reduce((s, v) => s + v, 0);
  return { totalFlagged, totalClean, totalFlags, flagCounts };
}
