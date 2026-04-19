import { windowChanges, windowRouteChanges, formatWindowText } from '../windower';
import { RouteChange } from '../../diff/types';

function makeItems(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

function makeChange(path: string): RouteChange {
  return { type: 'added', route: { method: 'GET', path, params: [] } } as RouteChange;
}

describe('windowChanges', () => {
  it('returns single window when items fit in one', () => {
    const result = windowChanges(makeItems(3), { size: 5 });
    expect(result).toHaveLength(1);
    expect(result[0].items).toEqual([0, 1, 2]);
  });

  it('splits into multiple windows with default step=size', () => {
    const result = windowChanges(makeItems(6), { size: 2 });
    expect(result).toHaveLength(3);
    expect(result[0].items).toEqual([0, 1]);
    expect(result[2].items).toEqual([4, 5]);
  });

  it('supports sliding windows with step < size', () => {
    const result = windowChanges(makeItems(5), { size: 3, step: 1 });
    expect(result).toHaveLength(5);
    expect(result[0].items).toEqual([0, 1, 2]);
    expect(result[1].items).toEqual([1, 2, 3]);
  });

  it('assigns correct index, start, end', () => {
    const result = windowChanges(makeItems(4), { size: 2 });
    expect(result[0]).toMatchObject({ index: 0, start: 0, end: 2 });
    expect(result[1]).toMatchObject({ index: 1, start: 2, end: 4 });
  });

  it('throws on invalid config', () => {
    expect(() => windowChanges([], { size: 0 })).toThrow();
    expect(() => windowChanges([], { size: 2, step: -1 })).toThrow();
  });

  it('returns empty array for empty input', () => {
    expect(windowChanges([], { size: 3 })).toEqual([]);
  });
});

describe('windowRouteChanges', () => {
  it('windows route changes', () => {
    const changes = [makeChange('/a'), makeChange('/b'), makeChange('/c')];
    const result = windowRouteChanges(changes, { size: 2 });
    expect(result).toHaveLength(2);
    expect(result[0].items).toHaveLength(2);
  });
});

describe('formatWindowText', () => {
  it('returns no-windows message for empty', () => {
    expect(formatWindowText([])).toBe('No windows.');
  });

  it('formats window summary', () => {
    const result = windowChanges(makeItems(4), { size: 2 });
    const text = formatWindowText(result);
    expect(text).toContain('Windows: 2');
    expect(text).toContain('Window 0');
    expect(text).toContain('Window 1');
  });
});
