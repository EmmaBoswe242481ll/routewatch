import { compareRoutes } from '../compare';
import type { ParsedRoute } from '../../parsers/types';

const makeRoute = (method: string, path: string, params: string[] = []): ParsedRoute => ({
  method,
  path,
  params,
  filePath: '/fake/file.ts',
  framework: 'nextjs',
});

describe('compareRoutes', () => {
  const FROM = 'abc123';
  const TO = 'def456';

  it('detects added routes', () => {
    const from: ParsedRoute[] = [];
    const to: ParsedRoute[] = [makeRoute('GET', '/api/users')];
    const result = compareRoutes(from, to, FROM, TO);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].type).toBe('added');
    expect(result.changes[0].path).toBe('/api/users');
    expect(result.summary.added).toBe(1);
  });

  it('detects removed routes', () => {
    const from: ParsedRoute[] = [makeRoute('DELETE', '/api/posts/:id', ['id'])];
    const to: ParsedRoute[] = [];
    const result = compareRoutes(from, to, FROM, TO);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].type).toBe('removed');
    expect(result.summary.removed).toBe(1);
  });

  it('detects modified routes (param changes)', () => {
    const from: ParsedRoute[] = [makeRoute('GET', '/api/items/:id', ['id'])];
    const to: ParsedRoute[] = [makeRoute('GET', '/api/items/:id', ['id', 'version'])];
    const result = compareRoutes(from, to, FROM, TO);
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].type).toBe('modified');
    expect(result.summary.modified).toBe(1);
  });

  it('returns no changes for identical routes', () => {
    const routes: ParsedRoute[] = [makeRoute('POST', '/api/login')];
    const result = compareRoutes(routes, routes, FROM, TO);
    expect(result.changes).toHaveLength(0);
    expect(result.summary.total).toBe(0);
  });

  it('sets fromCommit and toCommit on result', () => {
    const result = compareRoutes([], [], FROM, TO);
    expect(result.fromCommit).toBe(FROM);
    expect(result.toCommit).toBe(TO);
  });

  it('handles multiple changes at once', () => {
    const from: ParsedRoute[] = [
      makeRoute('GET', '/api/users'),
      makeRoute('DELETE', '/api/legacy'),
    ];
    const to: ParsedRoute[] = [
      makeRoute('GET', '/api/users'),
      makeRoute('POST', '/api/orders'),
    ];
    const result = compareRoutes(from, to, FROM, TO);
    expect(result.summary.added).toBe(1);
    expect(result.summary.removed).toBe(1);
    expect(result.summary.modified).toBe(0);
  });
});
