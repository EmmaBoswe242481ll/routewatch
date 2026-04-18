import { batchChanges, formatBatchText } from '../batcher';
import { RouteChange } from '../../diff/types';

function makeChange(path: string): RouteChange {
  return {
    type: 'added',
    route: { method: 'GET', path, params: [] },
  } as unknown as RouteChange;
}

describe('batchChanges', () => {
  it('splits changes into batches of given size', () => {
    const changes = [makeChange('/a'), makeChange('/b'), makeChange('/c'), makeChange('/d'), makeChange('/e')];
    const batches = batchChanges(changes, { size: 2 });
    expect(batches.length).toBe(3);
    expect(batches[0].items.length).toBe(2);
    expect(batches[1].items.length).toBe(2);
    expect(batches[2].items.length).toBe(1);
  });

  it('returns a single batch when changes fit in one batch', () => {
    const changes = [makeChange('/a'), makeChange('/b')];
    const batches = batchChanges(changes, { size: 5 });
    expect(batches.length).toBe(1);
    expect(batches[0].items.length).toBe(2);
    expect(batches[0].index).toBe(0);
  });

  it('returns empty batch for empty input', () => {
    const batches = batchChanges([], { size: 3 });
    expect(batches.length).toBe(1);
    expect(batches[0].items.length).toBe(0);
  });

  it('throws for size <= 0', () => {
    expect(() => batchChanges([], { size: 0 })).toThrow();
  });

  it('supports overlap', () => {
    const changes = [makeChange('/a'), makeChange('/b'), makeChange('/c'), makeChange('/d')];
    const batches = batchChanges(changes, { size: 3, overlap: 1 });
    expect(batches[0].items.map((c) => c.route.path)).toEqual(['/a', '/b', '/c']);
    expect(batches[1].items.map((c) => c.route.path)).toEqual(['/c', '/d']);
  });

  it('sets correct total and batchCount', () => {
    const changes = [makeChange('/a'), makeChange('/b'), makeChange('/c')];
    const batches = batchChanges(changes, { size: 2 });
    batches.forEach((b) => {
      expect(b.total).toBe(3);
      expect(b.batchCount).toBe(batches.length);
    });
  });
});

describe('formatBatchText', () => {
  it('formats batch summary', () => {
    const changes = [makeChange('/a'), makeChange('/b'), makeChange('/c')];
    const batches = batchChanges(changes, { size: 2 });
    const text = formatBatchText(batches);
    expect(text).toContain('Total batches:');
    expect(text).toContain('Batch 1/');
  });

  it('returns no batches message for empty array', () => {
    expect(formatBatchText([])).toBe('No batches.');
  });
});
