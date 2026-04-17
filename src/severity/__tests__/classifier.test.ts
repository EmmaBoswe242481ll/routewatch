import {
  classifyChange,
  classifyChanges,
  filterBySeverity,
  ClassifiedChange,
} from '../classifier';
import { RouteChange } from '../../diff/types';

const makeChange = (overrides: Partial<RouteChange> = {}): RouteChange => ({
  type: 'added',
  route: { path: '/api/test', method: 'GET', params: [], source: 'nextjs', file: 'test.ts' },
  ...overrides,
});

describe('classifyChange', () => {
  it('classifies added routes as info', () => {
    const result = classifyChange(makeChange({ type: 'added' }));
    expect(result.level).toBe('info');
  });

  it('classifies removed routes as critical', () => {
    const result = classifyChange(makeChange({ type: 'removed' }));
    expect(result.level).toBe('critical');
  });

  it('classifies modified routes as warning by default', () => {
    const result = classifyChange(makeChange({ type: 'modified' }));
    expect(result.level).toBe('warning');
  });

  it('escalates modified to critical when params are removed', () => {
    const result = classifyChange(
      makeChange({ type: 'modified', paramChanges: { added: [], removed: ['id'] } })
    );
    expect(result.level).toBe('critical');
    expect(result.reason).toContain('id');
  });

  it('keeps modified as warning when params are added', () => {
    const result = classifyChange(
      makeChange({ type: 'modified', paramChanges: { added: ['filter'], removed: [] } })
    );
    expect(result.level).toBe('warning');
    expect(result.reason).toContain('filter');
  });

  it('includes the route path in the classified change', () => {
    const change = makeChange({ type: 'removed' });
    const result = classifyChange(change);
    expect(result.change.route.path).toBe('/api/test');
  });
});

describe('classifyChanges', () => {
  it('maps all changes to classified results', () => {
    const changes = [
      makeChange({ type: 'added' }),
      makeChange({ type: 'removed' }),
    ];
    const results = classifyChanges(changes);
    expect(results).toHaveLength(2);
    expect(results[0].severity.level).toBe('info');
    expect(results[1].severity.level).toBe('critical');
  });

  it('returns an empty array when given no changes', () => {
    expect(classifyChanges([])).toEqual([]);
  });
});

describe('filterBySeverity', () => {
  const classified: ClassifiedChange[] = [
    { change: makeChange({ type: 'added' }), severity: { level: 'info', reason: 'new' } },
    { change: makeChange({ type: 'modified' }), severity: { level: 'warning', reason: 'changed' } },
    { change: makeChange({ type: 'removed' }), severity: { level: 'critical', reason: 'gone' } },
  ];

  it('returns all changes at info level', () => {
    expect(filterBySeverity(classified, 'info')).toHaveLength(3);
  });

  it('returns only warning and critical', () => {
    expect(filterBySeverity(classified, 'warning')).toHaveLength(2);
  });

  it('returns only critical changes', () => {
    expect(filterBySeverity(classified, 'critical')).toHaveLength(1);
  });
});
