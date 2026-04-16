import { RouteChange } from '../diff/types';

export interface RankedChange {
  change: RouteChange;
  score: number;
  rank: number;
  reasons: string[];
}

export interface RankOptions {
  weights?: {
    breaking?: number;
    added?: number;
    removed?: number;
    modified?: number;
  };
  limit?: number;
}

const DEFAULT_WEIGHTS = {
  breaking: 10,
  removed: 7,
  modified: 4,
  added: 2,
};

export function scoreChange(change: RouteChange, weights = DEFAULT_WEIGHTS): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  if (change.type === 'removed') {
    score += weights.removed;
    reasons.push('Route removed');
  } else if (change.type === 'added') {
    score += weights.added;
    reasons.push('Route added');
  } else if (change.type === 'modified') {
    score += weights.modified;
    reasons.push('Route modified');
  }

  if (change.breaking) {
    score += weights.breaking;
    reasons.push('Breaking change detected');
  }

  if (change.paramChanges && change.paramChanges.length > 0) {
    score += change.paramChanges.length * 2;
    reasons.push(`${change.paramChanges.length} param change(s)`);
  }

  return { score, reasons };
}

export function rankChanges(changes: RouteChange[], options: RankOptions = {}): RankedChange[] {
  const weights = { ...DEFAULT_WEIGHTS, ...options.weights };

  const scored = changes.map((change) => {
    const { score, reasons } = scoreChange(change, weights);
    return { change, score, rank: 0, reasons };
  });

  scored.sort((a, b) => b.score - a.score);

  scored.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  return options.limit ? scored.slice(0, options.limit) : scored;
}

export function formatRankText(ranked: RankedChange[]): string {
  if (ranked.length === 0) return 'No changes to rank.';
  return ranked
    .map((r) => `#${r.rank} [score:${r.score}] ${r.change.method} ${r.change.path} — ${r.reasons.join(', ')}`)
    .join('\n');
}
