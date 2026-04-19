import {
  createCycler,
  cycleNext,
  cyclePrev,
  getCurrent,
  formatCycleText,
} from '../cycler';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, type: 'added' | 'removed' | 'modified' = 'added'): RouteChange {
  return {
    type,
    route: { method: 'GET', path, params: [] },
  } as RouteChange;
}

describe('createCycler', () => {
  it('initializes with cursor at 0', () => {
    const state = createCycler([makeChange('/a'), makeChange('/b')]);
    expect(state.cursor).toBe(0);
    expect(state.changes).toHaveLength(2);
  });
});

describe('cycleNext', () => {
  it('advances cursor', () => {
    let state = createCycler([makeChange('/a'), makeChange('/b'), makeChange('/c')]);
    state = cycleNext(state);
    expect(state.cursor).toBe(1);
  });

  it('wraps around to 0', () => {
    let state = createCycler([makeChange('/a'), makeChange('/b')]);
    state = cycleNext(state);
    state = cycleNext(state);
    expect(state.cursor).toBe(0);
  });

  it('respects maxCycles', () => {
    let state = createCycler([makeChange('/a'), makeChange('/b'), makeChange('/c')], { maxCycles: 2 });
    state = cycleNext(state);
    state = cycleNext(state);
    expect(state.cursor).toBe(0);
  });
});

describe('cyclePrev', () => {
  it('decrements cursor', () => {
    let state = createCycler([makeChange('/a'), makeChange('/b'), makeChange('/c')]);
    state = cycleNext(state);
    state = cyclePrev(state);
    expect(state.cursor).toBe(0);
  });

  it('wraps around to last', () => {
    let state = createCycler([makeChange('/a'), makeChange('/b')]);
    state = cyclePrev(state);
    expect(state.cursor).toBe(1);
  });
});

describe('getCurrent', () => {
  it('returns null for empty changes', () => {
    const state = createCycler([]);
    expect(getCurrent(state)).toBeNull();
  });

  it('returns correct result', () => {
    const changes = [makeChange('/a'), makeChange('/b')];
    const state = createCycler(changes);
    const result = getCurrent(state);
    expect(result?.index).toBe(0);
    expect(result?.total).toBe(2);
    expect(result?.hasPrev).toBe(false);
    expect(result?.hasNext).toBe(true);
  });
});

describe('formatCycleText', () => {
  it('formats current cycle entry', () => {
    const state = createCycler([makeChange('/api/users', 'added')]);
    const text = formatCycleText(state);
    expect(text).toContain('Cycle [1/1]');
    expect(text).toContain('/api/users');
    expect(text).toContain('added');
  });

  it('returns message for empty state', () => {
    const state = createCycler([]);
    expect(formatCycleText(state)).toBe('No changes to cycle through.');
  });
});
