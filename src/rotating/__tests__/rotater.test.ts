import { rotateChange, rotateChanges, formatRotateText } from '../rotater';
import { buildRotateSummary } from '../types';

function makeChange(path: string, method = 'GET', changeType = 'added') {
  return { path, method, changeType };
}

describe('rotateChange', () => {
  it('rotates segments by default shift of 1', () => {
    const result = rotateChange(makeChange('/a/b/c'), { rules: [] });
    expect(result.rotated).toBe('/b/c/a');
    expect(result.shift).toBe(1);
  });

  it('uses configured defaultShift', () => {
    const result = rotateChange(makeChange('/a/b/c'), { rules: [], defaultShift: 2 });
    expect(result.rotated).toBe('/c/a/b');
  });

  it('applies matching rule shift', () => {
    const config = { rules: [{ pattern: '/api/*', shift: 2 }], defaultShift: 1 };
    const result = rotateChange(makeChange('/api/users'), config);
    expect(result.ruleMatched).toBe('/api/*');
    expect(result.shift).toBe(2);
  });

  it('handles root path without error', () => {
    const result = rotateChange(makeChange('/'), { rules: [] });
    expect(result.rotated).toBe('/');
  });

  it('preserves method and changeType', () => {
    const result = rotateChange(makeChange('/a/b', 'POST', 'removed'), { rules: [] });
    expect(result.method).toBe('POST');
    expect(result.changeType).toBe('removed');
  });

  it('handles shift larger than segment count via modulo', () => {
    const result = rotateChange(makeChange('/a/b'), { rules: [], defaultShift: 5 });
    expect(result.rotated).toBe('/b/a');
  });
});

describe('rotateChanges', () => {
  it('rotates all changes', () => {
    const changes = [makeChange('/a/b'), makeChange('/x/y/z')];
    const results = rotateChanges(changes, { rules: [], defaultShift: 1 });
    expect(results).toHaveLength(2);
    expect(results[0].rotated).toBe('/b/a');
    expect(results[1].rotated).toBe('/y/z/x');
  });

  it('returns empty array for empty input', () => {
    expect(rotateChanges([], { rules: [] })).toEqual([]);
  });
});

describe('buildRotateSummary', () => {
  it('counts rotated vs unchanged', () => {
    const changes = rotateChanges(
      [makeChange('/a/b'), makeChange('/')],
      { rules: [], defaultShift: 1 }
    );
    const summary = buildRotateSummary(changes);
    expect(summary.total).toBe(2);
    expect(summary.rotated).toBe(1);
    expect(summary.unchanged).toBe(1);
  });
});

describe('formatRotateText', () => {
  it('includes summary line', () => {
    const changes = rotateChanges([makeChange('/a/b')], { rules: [], defaultShift: 1 });
    const text = formatRotateText(changes);
    expect(text).toContain('Rotate Summary');
    expect(text).toContain('/a/b -> /b/a');
  });

  it('omits unchanged routes from detail lines', () => {
    const changes = rotateChanges([makeChange('/')], { rules: [], defaultShift: 1 });
    const text = formatRotateText(changes);
    expect(text).not.toContain('->');
  });
});
