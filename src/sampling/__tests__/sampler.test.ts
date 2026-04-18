import { sampleChanges, formatSampleText } from '../sampler';
import { RouteChange } from '../../diff/types';

function makeChange(path: string): RouteChange {
  return {
    type: 'added',
    route: { method: 'GET', path, params: [] },
  } as unknown as RouteChange;
}

const changes = Array.from({ length: 20 }, (_, i) => makeChange(`/route/${i}`));

describe('sampleChanges', () => {
  it('returns all items when rate is 1', () => {
    const result = sampleChanges(changes, { rate: 1, seed: 42 });
    expect(result.sampled.length).toBe(20);
    expect(result.total).toBe(20);
  });

  it('returns no items when rate is 0', () => {
    const result = sampleChanges(changes, { rate: 0, seed: 42 });
    expect(result.sampled.length).toBe(0);
  });

  it('clamps rate above 1', () => {
    const result = sampleChanges(changes, { rate: 5, seed: 1 });
    expect(result.rate).toBe(1);
  });

  it('clamps rate below 0', () => {
    const result = sampleChanges(changes, { rate: -1, seed: 1 });
    expect(result.rate).toBe(0);
  });

  it('respects maxItems cap', () => {
    const result = sampleChanges(changes, { rate: 1, seed: 42, maxItems: 5 });
    expect(result.sampled.length).toBeLessThanOrEqual(5);
  });

  it('produces deterministic results with seed', () => {
    const a = sampleChanges(changes, { rate: 0.5, seed: 99 });
    const b = sampleChanges(changes, { rate: 0.5, seed: 99 });
    expect(a.sampled.map(c => c.route.path)).toEqual(b.sampled.map(c => c.route.path));
  });

  it('returns correct metadata', () => {
    const result = sampleChanges(changes, { rate: 0.5, seed: 7 });
    expect(result.total).toBe(20);
    expect(result.rate).toBe(0.5);
    expect(result.sampleSize).toBe(result.sampled.length);
  });
});

describe('formatSampleText', () => {
  it('includes key fields', () => {
    const result = sampleChanges(changes, { rate: 0.5, seed: 1 });
    const text = formatSampleText(result);
    expect(text).toContain('Sampling Report');
    expect(text).toContain('50.0%');
    expect(text).toContain('20');
  });
});
