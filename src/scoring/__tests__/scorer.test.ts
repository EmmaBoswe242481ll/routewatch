import { scoreChange, scoreChanges, formatScoresText } from '../scorer';
import { RouteChange } from '../../diff/types';

function makeChange(overrides: Partial<RouteChange> = {}): RouteChange {
  return {
    type: 'modified',
    route: '/api/users',
    method: 'GET',
    severity: 'medium',
    paramChanges: [],
    ...overrides,
  };
}

describe('scoreChange', () => {
  it('returns a score with correct breakdown for medium severity', () => {
    const result = scoreChange(makeChange(), 1);
    expect(result.route).toBe('/api/users');
    expect(result.method).toBe('GET');
    expect(result.breakdown.severityScore).toBe(50);
    expect(result.score).toBeGreaterThan(0);
  });

  it('scores critical higher than low severity', () => {
    const critical = scoreChange(makeChange({ severity: 'critical' }), 1);
    const low = scoreChange(makeChange({ severity: 'low' }), 1);
    expect(critical.score).toBeGreaterThan(low.score);
  });

  it('increases impact score with more param changes', () => {
    const few = scoreChange(makeChange({ paramChanges: [{ name: 'id', changeType: 'added' }] }), 1);
    const many = scoreChange(
      makeChange({
        paramChanges: [
          { name: 'id', changeType: 'added' },
          { name: 'name', changeType: 'removed' },
          { name: 'page', changeType: 'added' },
        ],
      }),
      1
    );
    expect(many.breakdown.impactScore).toBeGreaterThan(few.breakdown.impactScore);
  });

  it('caps frequency score at 100', () => {
    const result = scoreChange(makeChange(), 999);
    expect(result.breakdown.frequencyScore).toBe(100);
  });

  it('defaults to info severity when not set', () => {
    const change = makeChange();
    delete (change as any).severity;
    const result = scoreChange(change, 1);
    expect(result.breakdown.severityScore).toBe(5);
  });
});

describe('scoreChanges', () => {
  it('returns scores sorted descending by score', () => {
    const changes = [
      makeChange({ route: '/a', severity: 'low' }),
      makeChange({ route: '/b', severity: 'critical' }),
      makeChange({ route: '/c', severity: 'medium' }),
    ];
    const results = scoreChanges(changes);
    expect(results[0].route).toBe('/b');
    expect(results[results.length - 1].route).toBe('/a');
  });

  it('returns empty array for no changes', () => {
    expect(scoreChanges([])).toEqual([]);
  });
});

describe('formatScoresText', () => {
  it('returns fallback message for empty scores', () => {
    expect(formatScoresText([])).toBe('No scores available.');
  });

  it('formats scores as readable lines', () => {
    const scores = scoreChanges([makeChange({ severity: 'high' })]);
    const text = formatScoresText(scores);
    expect(text).toContain('GET');
    expect(text).toContain('/api/users');
  });
});
