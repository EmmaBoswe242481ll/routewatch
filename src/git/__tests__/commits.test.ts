import { execSync } from 'child_process';
import {
  getCommitInfo,
  resolveRef,
  getChangedFiles,
  isGitRepository,
  getFileAtCommit,
} from '../commits';

jest.mock('child_process');

const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('commits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCommitInfo', () => {
    it('parses commit info from git log output', () => {
      mockExecSync.mockReturnValue(
        Buffer.from('abc123def|abc123d|feat: add routes|Jane Doe|2024-01-15T10:00:00Z')
      );

      const info = getCommitInfo('abc123def');

      expect(info).toEqual({
        hash: 'abc123def',
        shortHash: 'abc123d',
        message: 'feat: add routes',
        author: 'Jane Doe',
        date: '2024-01-15T10:00:00Z',
      });
    });
  });

  describe('resolveRef', () => {
    it('returns resolved commit hash', () => {
      mockExecSync.mockReturnValue(Buffer.from('deadbeef1234\n'));
      expect(resolveRef('HEAD')).toBe('deadbeef1234');
    });
  });

  describe('getChangedFiles', () => {
    it('returns list of changed files', () => {
      mockExecSync.mockReturnValue(
        Buffer.from('src/pages/api/users.ts\nsrc/pages/api/posts.ts\n')
      );

      const files = getChangedFiles({ from: 'abc', to: 'def' });
      expect(files).toEqual(['src/pages/api/users.ts', 'src/pages/api/posts.ts']);
    });

    it('returns empty array when no files changed', () => {
      mockExecSync.mockReturnValue(Buffer.from(''));
      expect(getChangedFiles({ from: 'abc', to: 'def' })).toEqual([]);
    });
  });

  describe('isGitRepository', () => {
    it('returns true when inside a git repo', () => {
      mockExecSync.mockReturnValue(Buffer.from('true'));
      expect(isGitRepository()).toBe(true);
    });

    it('returns false when not a git repo', () => {
      mockExecSync.mockImplementation(() => { throw new Error('not a repo'); });
      expect(isGitRepository()).toBe(false);
    });
  });

  describe('getFileAtCommit', () => {
    it('returns file content at given commit', () => {
      mockExecSync.mockReturnValue(Buffer.from('export default function handler() {}'));
      const content = getFileAtCommit('src/pages/api/test.ts', 'abc123');
      expect(content).toBe('export default function handler() {}');
    });

    it('returns null when file does not exist at commit', () => {
      mockExecSync.mockImplementation(() => { throw new Error('not found'); });
      expect(getFileAtCommit('missing.ts', 'abc123')).toBeNull();
    });
  });
});
