import { RouteChange } from '../diff/types';
import { SeverityLevel } from '../severity/classifier';

export interface RouteScore {
  route: string;
  method: string;
  score: number;
  breakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  severityScore: number;
  frequencyScore: number;
  impactScore: number;
}

export interface ScoringWeights {
  severity: number;
  frequency: number;
  impact: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  severity: 0.5,
  frequency: 0.3,
  impact: 0.2,
};

const SEVERITY_SCORES: Record<SeverityLevel, number> = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25,
  info: 5,
};

export function scoreChange(
  change: RouteChange,
  frequency: number,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): RouteScore {
  const severityScore = SEVERITY_SCORES[change.severity ?? 'info'];
  const frequencyScore = Math.min(frequency * 10, 100);
  const impactScore = change.paramChanges && change.paramChanges.length > 0
    ? Math.min(change.paramChanges.length * 20, 100)
    : 0;

  const score =
    severityScore * weights.severity +
    frequencyScore * weights.frequency +
    impactScore * weights.impact;

  return {
    route: change.route,
    method: change.method,
    score: Math.round(score),
    breakdown: { severityScore, frequencyScore, impactScore },
  };
}

export function scoreChanges(
  changes: RouteChange[],
  weights?: ScoringWeights
): RouteScore[] {
  const frequencyMap = new Map<string, number>();
  for (const c of changes) {
    const key = `${c.method}:${c.route}`;
    frequencyMap.set(key, (frequencyMap.get(key) ?? 0) + 1);
  }

  return changes
    .map((c) => {
      const key = `${c.method}:${c.route}`;
      return scoreChange(c, frequencyMap.get(key) ?? 1, weights);
    })
    .sort((a, b) => b.score - a.score);
}

export function formatScoresText(scores: RouteScore[]): string {
  if (scores.length === 0) return 'No scores available.';
  return scores
    .map(
      (s) =>
        `[${s.score}] ${s.method.toUpperCase()} ${s.route} ` +
        `(severity=${s.breakdown.severityScore}, freq=${s.breakdown.frequencyScore}, impact=${s.breakdown.impactScore})`
    )
    .join('\n');
}
