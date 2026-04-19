import { quoteChange, quoteChanges, formatQuoteText } from '../quoter';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, method = 'GET', type: 'added' | 'removed' | 'modified' = 'added'): RouteChange {
  return { path, method, type, before: null, after: null };
}

describe('quoteChange', () => {
  const options = {
    rules: [
      { pattern: '/api/*', template: 'API: {method} {path}' },
      { pattern: '/admin/*', template: 'ADMIN: {path}' },
    ],
    defaultTemplate: 'DEFAULT: {method} {path} ({type})',
  };

  it('applies matching rule template', () => {
    const result = quoteChange(makeChange('/api/users'), options);
    expect(result.quote).toBe('API: GET /api/users');
    expect(result.template).toBe('API: {method} {path}');
  });

  it('applies second rule when first does not match', () => {
    const result = quoteChange(makeChange('/admin/settings'), options);
    expect(result.quote).toBe('ADMIN: /admin/settings');
  });

  it('falls back to default template', () => {
    const result = quoteChange(makeChange('/other/route'), options);
    expect(result.quote).toBe('DEFAULT: GET /other/route (added)');
  });

  it('escapes special characters when escape is true', () => {
    const change = makeChange('/api/test"path');
    const result = quoteChange(change, { ...options, escape: true });
    expect(result.quote).toContain('\\"');
  });
});

describe('quoteChanges', () => {
  it('quotes all changes', () => {
    const changes = [makeChange('/api/a'), makeChange('/api/b')];
    const results = quoteChanges(changes, { rules: [], defaultTemplate: '{path}' });
    expect(results).toHaveLength(2);
    expect(results[0].quote).toBe('/api/a');
  });
});

describe('formatQuoteText', () => {
  it('returns message for empty array', () => {
    expect(formatQuoteText([])).toBe('No quoted changes.');
  });

  it('formats quoted changes', () => {
    const changes = [makeChange('/api/users')];
    const quoted = quoteChanges(changes, { rules: [], defaultTemplate: '{method} {path}' });
    const text = formatQuoteText(quoted);
    expect(text).toContain('Quoted Changes (1)');
    expect(text).toContain('[added] GET /api/users');
  });
});
