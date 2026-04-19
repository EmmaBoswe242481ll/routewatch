import { RouteChange } from '../diff/types';

export interface CycleConfig {
  maxCycles?: number;
  fields?: Array<'method' | 'path' | 'type'>;
}

export interface CycleResult {
  index: number;
  total: number;
  current: RouteChange;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CycleState {
  changes: RouteChange[];
  cursor: number;
  config: CycleConfig;
}

export function createCycler(changes: RouteChange[], config: CycleConfig = {}): CycleState {
  return { changes, cursor: 0, config };
}

export function cycleNext(state: CycleState): CycleState {
  const max = state.config.maxCycles ?? state.changes.length;
  const next = (state.cursor + 1) % Math.min(max, state.changes.length);
  return { ...state, cursor: next };
}

export function cyclePrev(state: CycleState): CycleState {
  const max = state.config.maxCycles ?? state.changes.length;
  const len = Math.min(max, state.changes.length);
  const prev = (state.cursor - 1 + len) % len;
  return { ...state, cursor: prev };
}

export function getCurrent(state: CycleState): CycleResult | null {
  if (state.changes.length === 0) return null;
  const total = Math.min(state.config.maxCycles ?? state.changes.length, state.changes.length);
  return {
    index: state.cursor,
    total,
    current: state.changes[state.cursor],
    hasNext: state.cursor < total - 1,
    hasPrev: state.cursor > 0,
  };
}

export function formatCycleText(state: CycleState): string {
  const result = getCurrent(state);
  if (!result) return 'No changes to cycle through.';
  const { index, total, current } = result;
  const lines: string[] = [
    `Cycle [${index + 1}/${total}]`,
    `  Type   : ${current.type}`,
    `  Method : ${current.route.method}`,
    `  Path   : ${current.route.path}`,
  ];
  return lines.join('\n');
}
