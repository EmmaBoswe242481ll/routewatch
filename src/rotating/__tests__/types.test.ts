import { buildRotateSummary, RotatedChange } from '../types';

function makeRotated(original: string, rotated: string): RotatedChange {
  return { original, rotated, method: 'GET', changeType: 'added', shift: 1 };
}

describe('buildRotateSummary', () => {
  it('returns zero counts for empty array', () => {
    const summary = buildRotateSummary([]);
    expect(summary.total).toBe(0);
    expect(summary.rotated).toBe(0);
    expect(summary.unchanged).toBe(0);
  });

  it('counts correctly when all are rotated', () => {
    const changes = [
      makeRotated('/a/b', '/b/a'),
      makeRotated('/x/y', '/y/x'),
    ];
    const summary = buildRotateSummary(changes);
    expect(summary.total).toBe(2);
    expect(summary.rotated).toBe(2);
    expect(summary.unchanged).toBe(0);
  });

  it('counts correctly when none are rotated', () => {
    const changes = [makeRotated('/a', '/a')];
    const summary = buildRotateSummary(changes);
    expect(summary.rotated).toBe(0);
    expect(summary.unchanged).toBe(1);
  });

  it('total equals rotated plus unchanged', () => {
    const changes = [
      makeRotated('/a/b', '/b/a'),
      makeRotated('/c', '/c'),
      makeRotated('/d/e/f', '/e/f/d'),
    ];
    const summary = buildRotateSummary(changes);
    expect(summary.total).toBe(summary.rotated + summary.unchanged);
  });
});
