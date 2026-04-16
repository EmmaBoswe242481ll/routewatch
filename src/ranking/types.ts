import { RankedChange, RankOptions } from './ranker';

export type { RankedChange, RankOptions };

export interface RankResult {
  ranked: RankedChange[];
  total: number;
  limited: boolean;
}

export function buildRankResult(ranked: RankedChange[], limit?: number): RankResult {
  return {
    ranked,
    total: ranked.length,
    limited: limit !== undefined && ranked.length === limit,
  };
}
