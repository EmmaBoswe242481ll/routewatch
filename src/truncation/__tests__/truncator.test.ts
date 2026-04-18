import {
  truncatePath,
  truncateChanges,
  formatTruncationText,
} from '../truncator';
import { RouteChange } from '../../diff/types';

function makeChange(path: string, method = 'GET'): RouteChange {
  return { type: 'added', path, method, params: [] };
}

describe('truncatePath', () => {
  it('returns path unchanged when within limit', () => {
    expect(truncatePath('/api/users', 20)).toBe('/api/users');
  });

  it('truncates path exceeding max length', () => {
    const long = '/api/users/profile/settings/advanced';
    const result = truncatePath(long, 20);
    expect(result.length).toBe(20);
    expect(result.endsWith('...')).toBe(true);
  });

  it('uses custom ellipsis', () => {
    const result = truncatePath('/api/very/long/path', 12, '…');
    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBe(12);
  });
});

describe('truncateChanges', () => {
  it('returns all changes when under maxChanges', () => {
    const changes = [makeChange('/a'), makeChange('/b')];
    const result = truncateChanges(changes, { maxChanges: 10 });
    expect(result.changes).toHaveLength(2);
    expect(result.truncated).toBe(0);
  });

  it('limits changes to maxChanges', () => {
    const changes = [makeChange('/a'), makeChange('/b'), makeChange('/c')];
    const result = truncateChanges(changes, { maxChanges: 2 });
    expect(result.changes).toHaveLength(2);
    expect(result.truncated).toBe(1);
    expect(result.original).toBe(3);
  });

  it('truncates long paths', () => {
    const changes = [makeChange('/api/users/profile/settings/advanced/options')];
    const result = truncateChanges(changes, { maxPathLength: 20 });
    expect(result.pathsTruncated).toBe(1);
    expect(result.changes[0].path.length).toBe(20);
  });

  it('does not count short paths as truncated', () => {
    const changes = [makeChange('/short')];
    const result = truncateChanges(changes, { maxPathLength: 80 });
    expect(result.pathsTruncated).toBe(0);
  });
});

describe('formatTruncationText', () => {
  it('renders summary text', () => {
    const changes = [makeChange('/a')];
    const result = truncateChanges(changes, { maxChanges: 5 });
    const text = formatTruncationText(result);
    expect(text).toContain('Truncation Summary');
    expect(text).toContain('Total input changes');
    expect(text).toContain('Changes removed');
  });
});
