import { redactChange, redactChanges, formatRedactionText } from '../redactor';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, method = 'GET'): RouteChange {
  return { path, method, type: 'added', params: [] };
}

describe('redactChange', () => {
  it('redacts path matching pattern', () => {
    const result = redactChange(makeChange('/api/secret/data'), {
      rules: [{ field: 'path', pattern: 'secret' }],
    });
    expect(result.redacted).toBe(true);
    expect(result.fieldsRedacted).toContain('path');
    expect(result.change.path).toContain('[REDACTED]');
  });

  it('uses custom replacement', () => {
    const result = redactChange(makeChange('/api/token/abc'), {
      rules: [{ field: 'path', pattern: 'token', replacement: '***' }],
    });
    expect(result.change.path).toContain('***');
  });

  it('does not redact non-matching change', () => {
    const result = redactChange(makeChange('/api/users'), {
      rules: [{ field: 'path', pattern: 'secret' }],
    });
    expect(result.redacted).toBe(false);
    expect(result.change.path).toBe('/api/users');
  });

  it('redacts method field', () => {
    const result = redactChange(makeChange('/api/data', 'DELETE'), {
      rules: [{ field: 'method', pattern: 'DELETE' }],
    });
    expect(result.redacted).toBe(true);
    expect(result.fieldsRedacted).toContain('method');
  });

  it('uses custom placeholder', () => {
    const result = redactChange(makeChange('/internal/route'), {
      rules: [{ field: 'path', pattern: 'internal' }],
      placeholder: '<hidden>',
    });
    expect(result.change.path).toContain('<hidden>');
  });
});

describe('redactChanges', () => {
  it('processes multiple changes', () => {
    const changes = [makeChange('/api/secret'), makeChange('/api/public')];
    const results = redactChanges(changes, {
      rules: [{ field: 'path', pattern: 'secret' }],
    });
    expect(results).toHaveLength(2);
    expect(results[0].redacted).toBe(true);
    expect(results[1].redacted).toBe(false);
  });
});

describe('formatRedactionText', () => {
  it('formats summary text', () => {
    const changes = [makeChange('/api/secret'), makeChange('/api/public')];
    const results = redactChanges(changes, {
      rules: [{ field: 'path', pattern: 'secret' }],
    });
    const text = formatRedactionText(results);
    expect(text).toContain('1/2 changes redacted');
    expect(text).toContain('path');
  });
});
