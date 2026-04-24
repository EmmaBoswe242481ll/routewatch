import { RouteChange } from '../diff/types';

export interface StackFrame {
  id: string;
  label: string;
  changes: RouteChange[];
  pushedAt: number;
}

export interface StackState {
  frames: StackFrame[];
  maxDepth: number;
}

export function createStack(maxDepth = 10): StackState {
  return { frames: [], maxDepth };
}

export function pushFrame(
  state: StackState,
  label: string,
  changes: RouteChange[]
): StackState {
  const frame: StackFrame = {
    id: `frame-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label,
    changes,
    pushedAt: Date.now(),
  };
  const frames = [...state.frames, frame].slice(-state.maxDepth);
  return { ...state, frames };
}

export function popFrame(state: StackState): [StackFrame | undefined, StackState] {
  if (state.frames.length === 0) return [undefined, state];
  const frames = [...state.frames];
  const top = frames.pop();
  return [top, { ...state, frames }];
}

export function peekFrame(state: StackState): StackFrame | undefined {
  return state.frames[state.frames.length - 1];
}

export function flattenStack(state: StackState): RouteChange[] {
  const seen = new Set<string>();
  const result: RouteChange[] = [];
  for (const frame of [...state.frames].reverse()) {
    for (const change of frame.changes) {
      const key = `${change.method}:${change.path}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(change);
      }
    }
  }
  return result;
}

export function formatStackText(state: StackState): string {
  if (state.frames.length === 0) return 'Stack is empty.';
  const lines = [`Stack depth: ${state.frames.length}/${state.maxDepth}`];
  state.frames.forEach((f, i) => {
    lines.push(`  [${i}] ${f.label} — ${f.changes.length} change(s) (id: ${f.id})`);
  });
  return lines.join('\n');
}
