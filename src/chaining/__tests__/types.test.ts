import { buildChainSummary } from '../types';
import { RouteChange } from '../../parsers/types';

function makeChange(method: string, path: string): RouteChange {
  return { method, path, type: 'added', params: [] };
}

describe('buildChainSummary', () => {
  const changes = [makeChange('GET', '/a')];

  it('builds a summary with correct label', () => {
    const summary = buildChainSummary('test-chain', [], changes);
    expect(summary.label).toBe('test-chain');
  });

  it('counts total steps', () => {
    const steps = [
      { name: 'step1', before: 5, after: 3 },
      { name: 'step2', before: 3, after: 1 },
    ];
    const summary = buildChainSummary('chain', steps, changes);
    expect(summary.totalSteps).toBe(2);
  });

  it('computes totalReduced from first step before minus final length', () => {
    const steps = [{ name: 'step1', before: 10, after: 5 }];
    const summary = buildChainSummary('chain', steps, changes);
    expect(summary.totalReduced).toBe(9);
  });

  it('returns zero totalReduced when no steps', () => {
    const summary = buildChainSummary('chain', [], changes);
    expect(summary.totalReduced).toBe(0);
  });

  it('includes changes in result', () => {
    const summary = buildChainSummary('chain', [], changes);
    expect(summary.changes).toEqual(changes);
  });
});
