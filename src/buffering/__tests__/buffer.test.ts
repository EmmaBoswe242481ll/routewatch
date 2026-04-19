import {
  createBuffer,
  pushToBuffer,
  flushBuffer,
  isBufferFull,
  isBufferExpired,
  formatBufferText,
} from '../buffer';
import { RouteChange } from '../../diff/types';

function makeChange(path = '/api/test'): RouteChange {
  return { type: 'added', route: { method: 'GET', path, params: [] } } as any;
}

describe('buffer', () => {
  it('creates an empty buffer', () => {
    const state = createBuffer({ maxSize: 10 });
    expect(state.changes).toHaveLength(0);
    expect(state.flushedAt).toBeNull();
  });

  it('pushes changes into buffer', () => {
    let state = createBuffer({ maxSize: 10 });
    state = pushToBuffer(state, makeChange());
    state = pushToBuffer(state, makeChange('/api/other'));
    expect(state.changes).toHaveLength(2);
  });

  it('flushes buffer and clears changes', () => {
    let state = createBuffer({ maxSize: 10 });
    state = pushToBuffer(state, makeChange());
    const { flushed, state: next } = flushBuffer(state);
    expect(flushed).toHaveLength(1);
    expect(next.changes).toHaveLength(0);
    expect(next.flushedAt).not.toBeNull();
  });

  it('detects full buffer', () => {
    const config = { maxSize: 2 };
    let state = createBuffer(config);
    state = pushToBuffer(state, makeChange());
    expect(isBufferFull(state, config)).toBe(false);
    state = pushToBuffer(state, makeChange());
    expect(isBufferFull(state, config)).toBe(true);
  });

  it('detects expired buffer', () => {
    const config = { maxSize: 10, flushInterval: 1000 };
    const state = { ...createBuffer(config), createdAt: Date.now() - 2000 };
    expect(isBufferExpired(state, config)).toBe(true);
  });

  it('returns false for expiry when no interval set', () => {
    const config = { maxSize: 10 };
    const state = { ...createBuffer(config), createdAt: Date.now() - 99999 };
    expect(isBufferExpired(state, config)).toBe(false);
  });

  it('formats buffer text', () => {
    let state = createBuffer({ maxSize: 5 });
    state = pushToBuffer(state, makeChange());
    const text = formatBufferText(state);
    expect(text).toContain('1 change(s)');
    expect(text).toContain('Never flushed');
  });
});
