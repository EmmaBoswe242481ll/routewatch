import { sliceChanges, formatSliceText } from '../slicer';
import { RouteChange } from '../../diff/types';

function makeChange(path: string): RouteChange {
  return { type: 'added', route: { path, method: 'GET', params: [] } } as any;
}

const changes = Array.from({ length: 10 }, (_, i) => makeChange(`/route/${i}`));

describe('sliceChanges', () => {
  it('returns correct slice', () => {
    const result = sliceChanges(changes, { offset: 0, limit: 3 });
    expect(result.changes).toHaveLength(3);
    expect(result.total).toBe(10);
    expect(result.hasMore).toBe(true);
  });

  it('handles offset beyond total', () => {
    const result = sliceChanges(changes, { offset: 20, limit: 5 });
    expect(result.changes).toHaveLength(0);
    expect(result.hasMore).toBe(false);
  });

  it('detects last page', () => {
    const result = sliceChanges(changes, { offset: 8, limit: 5 });
    expect(result.changes).toHaveLength(2);
    expect(result.hasMore).toBe(false);
  });

  it('clamps negative offset to 0', () => {
    const result = sliceChanges(changes, { offset: -5, limit: 3 });
    expect(result.offset).toBe(0);
    expect(result.changes).toHaveLength(3);
  });
});

describe('formatSliceText', () => {
  it('includes offset and limit info', () => {
    const result = sliceChanges(changes, { offset: 0, limit: 5 });
    const text = formatSliceText(result);
    expect(text).toContain('offset=0');
    expect(text).toContain('limit=5');
    expect(text).toContain('5 of 10');
    expect(text).toContain('next offset=5');
  });

  it('shows no more message on last page', () => {
    const result = sliceChanges(changes, { offset: 9, limit: 5 });
    const text = formatSliceText(result);
    expect(text).toContain('No more changes.');
  });
});
