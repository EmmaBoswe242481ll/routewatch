import {
  trimPath,
  trimChange,
  trimChanges,
  formatTrimText,
} from '../trimmer';
import { RouteChange } from '../../diff/types';

function makeChange(path: string): RouteChange {
  return { path, method: 'GET', type: 'added', route: path };
}

describe('trimPath', () => {
  it('strips trailing slash by default', () => {
    const r = trimPath('/api/users/');
    expect(r.trimmed).toBe('/api/users');
    expect(r.changed).toBe(true);
  });

  it('preserves root slash', () => {
    const r = trimPath('/');
    expect(r.trimmed).toBe('/');
    expect(r.changed).toBe(false);
  });

  it('collapses double slashes', () => {
    const r = trimPath('/api//users');
    expect(r.trimmed).toBe('/api/users');
    expect(r.changed).toBe(true);
  });

  it('strips leading slash when option set', () => {
    const r = trimPath('/api/users', { stripLeadingSlash: true });
    expect(r.trimmed).toBe('api/users');
    expect(r.changed).toBe(true);
  });

  it('truncates to maxPathLength', () => {
    const r = trimPath('/api/users/profile', { maxPathLength: 10 });
    expect(r.trimmed.length).toBeLessThanOrEqual(10);
    expect(r.changed).toBe(true);
  });

  it('returns unchanged when no trimming needed', () => {
    const r = trimPath('/api/users');
    expect(r.changed).toBe(false);
    expect(r.trimmed).toBe('/api/users');
  });
});

describe('trimChange', () => {
  it('updates path on change', () => {
    const c = makeChange('/api/users/');
    const result = trimChange(c);
    expect(result.path).toBe('/api/users');
  });

  it('returns same reference when unchanged', () => {
    const c = makeChange('/api/users');
    const result = trimChange(c);
    expect(result).toBe(c);
  });
});

describe('trimChanges', () => {
  it('trims all changes', () => {
    const changes = [makeChange('/a/'), makeChange('/b/'), makeChange('/c')];
    const results = trimChanges(changes);
    expect(results[0].path).toBe('/a');
    expect(results[1].path).toBe('/b');
    expect(results[2].path).toBe('/c');
  });
});

describe('formatTrimText', () => {
  it('reports no changes when none trimmed', () => {
    const text = formatTrimText([{ original: '/a', trimmed: '/a', changed: false }]);
    expect(text).toBe('No paths trimmed.');
  });

  it('lists trimmed paths', () => {
    const text = formatTrimText([
      { original: '/a/', trimmed: '/a', changed: true },
      { original: '/b', trimmed: '/b', changed: false },
    ]);
    expect(text).toContain('Trimmed 1 path(s)');
    expect(text).toContain('"/a/" → "/a"');
  });
});
