import {
  createStack,
  pushFrame,
  popFrame,
  peekFrame,
  flattenStack,
  formatStackText,
} from '../stacker';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, method = 'GET'): RouteChange {
  return { type: 'added', path, method, params: [] } as unknown as RouteChange;
}

describe('createStack', () => {
  it('creates an empty stack with default maxDepth', () => {
    const s = createStack();
    expect(s.frames).toHaveLength(0);
    expect(s.maxDepth).toBe(10);
  });

  it('respects custom maxDepth', () => {
    const s = createStack(3);
    expect(s.maxDepth).toBe(3);
  });
});

describe('pushFrame', () => {
  it('adds a frame to the stack', () => {
    let s = createStack();
    s = pushFrame(s, 'test', [makeChange('/a')]);
    expect(s.frames).toHaveLength(1);
    expect(s.frames[0].label).toBe('test');
  });

  it('respects maxDepth by dropping oldest frames', () => {
    let s = createStack(2);
    s = pushFrame(s, 'f1', []);
    s = pushFrame(s, 'f2', []);
    s = pushFrame(s, 'f3', []);
    expect(s.frames).toHaveLength(2);
    expect(s.frames[0].label).toBe('f2');
    expect(s.frames[1].label).toBe('f3');
  });
});

describe('popFrame', () => {
  it('pops the top frame', () => {
    let s = createStack();
    s = pushFrame(s, 'first', []);
    s = pushFrame(s, 'second', []);
    const [frame, next] = popFrame(s);
    expect(frame?.label).toBe('second');
    expect(next.frames).toHaveLength(1);
  });

  it('returns undefined on empty stack', () => {
    const s = createStack();
    const [frame] = popFrame(s);
    expect(frame).toBeUndefined();
  });
});

describe('peekFrame', () => {
  it('returns top frame without removing it', () => {
    let s = createStack();
    s = pushFrame(s, 'top', []);
    expect(peekFrame(s)?.label).toBe('top');
    expect(s.frames).toHaveLength(1);
  });
});

describe('flattenStack', () => {
  it('deduplicates changes across frames by method+path', () => {
    let s = createStack();
    s = pushFrame(s, 'a', [makeChange('/x'), makeChange('/y')]);
    s = pushFrame(s, 'b', [makeChange('/x'), makeChange('/z')]);
    const flat = flattenStack(s);
    const paths = flat.map(c => c.path);
    expect(paths).toContain('/x');
    expect(paths.filter(p => p === '/x')).toHaveLength(1);
    expect(paths).toContain('/y');
    expect(paths).toContain('/z');
  });
});

describe('formatStackText', () => {
  it('returns empty message for empty stack', () => {
    expect(formatStackText(createStack())).toBe('Stack is empty.');
  });

  it('includes depth and frame labels', () => {
    let s = createStack();
    s = pushFrame(s, 'release-v1', [makeChange('/api/users')]);
    const text = formatStackText(s);
    expect(text).toMatch('Stack depth: 1/10');
    expect(text).toMatch('release-v1');
    expect(text).toMatch('1 change(s)');
  });
});
