import { annotateChange, annotateChanges, formatAnnotationText } from '../annotator';
import { RouteChange } from '../../diff/types';

function makeChange(route: string, method = 'GET'): RouteChange {
  return { route, method, type: 'added', params: [] };
}

const rules = [
  { pattern: '/api/v1/*', annotations: [{ key: 'version', value: 'v1' }] },
  { pattern: '/api/*/users', annotations: [{ key: 'resource', value: 'users' }] },
];

describe('annotateChange', () => {
  it('applies matching rule annotations', () => {
    const result = annotateChange(makeChange('/api/v1/orders'), rules);
    expect(result.annotations).toEqual([{ key: 'version', value: 'v1' }]);
  });

  it('applies multiple matching rules', () => {
    const result = annotateChange(makeChange('/api/v1/users'), rules);
    expect(result.annotations).toHaveLength(2);
  });

  it('returns empty annotations when no rules match', () => {
    const result = annotateChange(makeChange('/health'), rules);
    expect(result.annotations).toEqual([]);
  });

  it('preserves original change fields', () => {
    const change = makeChange('/api/v1/items', 'POST');
    const result = annotateChange(change, rules);
    expect(result.route).toBe('/api/v1/items');
    expect(result.method).toBe('POST');
    expect(result.type).toBe('added');
  });
});

describe('annotateChanges', () => {
  it('annotates all changes', () => {
    const changes = [makeChange('/api/v1/foo'), makeChange('/health')];
    const results = annotateChanges(changes, { rules });
    expect(results).toHaveLength(2);
    expect(results[0].annotations).toHaveLength(1);
    expect(results[1].annotations).toHaveLength(0);
  });
});

describe('formatAnnotationText', () => {
  it('formats annotated changes', () => {
    const changes = annotateChanges([makeChange('/api/v1/foo')], { rules });
    const text = formatAnnotationText(changes);
    expect(text).toContain('version=v1');
  });

  it('returns fallback when no annotations matched', () => {
    const changes = annotateChanges([makeChange('/health')], { rules });
    const text = formatAnnotationText(changes);
    expect(text).toBe('No annotations matched.');
  });

  it('returns message for empty array', () => {
    expect(formatAnnotationText([])).toBe('No annotated changes.');
  });
});
