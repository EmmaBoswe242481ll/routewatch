import { RouteChange } from '../parsers/types';

export interface ChainOptions {
  stopOnEmpty?: boolean;
  label?: string;
}

export interface ChainStepMeta {
  name: string;
  before: number;
  after: number;
  durationMs?: number;
}

export interface ChainSummary {
  label: string;
  totalSteps: number;
  totalReduced: number;
  steps: ChainStepMeta[];
  changes: RouteChange[];
}

export function buildChainSummary(
  label: string,
  steps: ChainStepMeta[],
  changes: RouteChange[]
): ChainSummary {
  const totalReduced = steps.length > 0
    ? steps[0].before - changes.length
    : 0;
  return { label, totalSteps: steps.length, totalReduced, steps, changes };
}
