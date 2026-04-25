import { traceChange, traceChanges, formatTraceText } from '../tracer';
import { TraceRule } from '../types';

function makeChange(path: string, method = 'GET', changeType = 'added') {
  return { path, method, changeType };
}

const rules: TraceRule[] = [
  { pattern: '/api/*', label: 'api-surface' },
  { pattern: '/health', label: 'infra' },
];

describe('traceChange', () => {
  it('returns a TracedChange when pattern matches', () => {
    const result = traceChange(makeChange('/api/users'), rules);
    expect(result).not.toBeNull();
    expect(result?.path).toBe('/api/users');
    expect(result?.label).toBe('api-surface');
    expect(result?.traceId).toHaveLength(12);
    expect(result?.tracedAt).toBeTruthy();
  });

  it('returns null when no pattern matches', () => {
    const result = traceChange(makeChange('/internal/metrics'), rules);
    expect(result).toBeNull();
  });

  it('assigns correct label for exact match', () => {
    const result = traceChange(makeChange('/health'), rules);
    expect(result?.label).toBe('infra');
  });

  it('preserves method and changeType', () => {
    const result = traceChange(makeChange('/api/orders', 'POST', 'modified'), rules);
    expect(result?.method).toBe('POST');
    expect(result?.changeType).toBe('modified');
  });
});

describe('traceChanges', () => {
  it('traces matching changes and counts untraced', () => {
    const changes = [
      makeChange('/api/users'),
      makeChange('/api/products'),
      makeChange('/internal/debug'),
    ];
    const result = traceChanges(changes, rules);
    expect(result.traced).toHaveLength(2);
    expect(result.untraced).toBe(1);
    expect(result.totalInput).toBe(3);
  });

  it('returns empty traced array when no rules match', () => {
    const result = traceChanges([makeChange('/foo/bar')], []);
    expect(result.traced).toHaveLength(0);
    expect(result.untraced).toBe(1);
  });
});

describe('formatTraceText', () => {
  it('returns message when no changes traced', () => {
    const text = formatTraceText({ traced: [], untraced: 2, totalInput: 2 });
    expect(text).toMatch(/No changes matched/);
  });

  it('formats traced changes with summary', () => {
    const result = traceChanges([makeChange('/api/users'), makeChange('/health')], rules);
    const text = formatTraceText(result);
    expect(text).toMatch(/GET \/api\/users/);
    expect(text).toMatch(/api-surface/);
    expect(text).toMatch(/Traced: 2/);
  });
});
