import { RouteChange } from '../diff/types';

export interface SampleOptions {
  rate: number; // 0.0 - 1.0
  seed?: number;
  maxItems?: number;
}

export interface SampleResult {
  sampled: RouteChange[];
  total: number;
  sampleSize: number;
  rate: number;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function sampleChanges(
  changes: RouteChange[],
  options: SampleOptions
): SampleResult {
  const { rate, seed, maxItems } = options;
  const clampedRate = Math.min(1, Math.max(0, rate));
  const rand = seed !== undefined ? seededRandom(seed) : Math.random;

  let sampled = changes.filter(() => rand() < clampedRate);

  if (maxItems !== undefined && sampled.length > maxItems) {
    sampled = sampled.slice(0, maxItems);
  }

  return {
    sampled,
    total: changes.length,
    sampleSize: sampled.length,
    rate: clampedRate,
  };
}

export function formatSampleText(result: SampleResult): string {
  const lines: string[] = [
    `Sampling Report`,
    `  Total changes : ${result.total}`,
    `  Sample rate   : ${(result.rate * 100).toFixed(1)}%`,
    `  Sampled items : ${result.sampleSize}`,
  ];
  return lines.join('\n');
}
