import { run } from '../run';
import * as git from '../../git/commits';
import * as parsers from '../../parsers';
import * as compare from '../../diff/compare';
import * as reporters from '../../reporters/generate';
import * as loader from '../../config/loader';

jest.mock('../../git/commits');
jest.mock('../../parsers');
jest.mock('../../diff/compare');
jest.mock('../../reporters/generate');
jest.mock('../../config/loader');

const mockGit = git as jest.Mocked<typeof git>;
const mockParsers = parsers as jest.Mocked<typeof parsers>;
const mockCompare = compare as jest.Mocked<typeof compare>;
const mockReporters = reporters as jest.Mocked<typeof reporters>;
const mockLoader = loader as jest.Mocked<typeof loader>;

beforeEach(() => {
  jest.clearAllMocks();
  mockGit.isGitRepository.mockResolvedValue(true);
  mockGit.resolveRef.mockImplementation(async (ref) => ref);
  mockGit.getChangedFiles.mockResolvedValue(['pages/api/users.ts']);
  mockGit.getFileAtCommit.mockResolvedValue('export default function handler() {}');
  mockLoader.loadConfig.mockResolvedValue({ include: ['pages/api', 'routes'] });
  mockParsers.parseFiles.mockReturnValue([]);
  mockCompare.compareRoutes.mockReturnValue({ added: [], removed: [], modified: [] });
  mockReporters.generateReport.mockReturnValue({ summary: '', changes: [] } as any);
  mockReporters.renderReport.mockReturnValue('No changes detected.');
});

describe('run', () => {
  it('throws if not a git repository', async () => {
    mockGit.isGitRepository.mockResolvedValue(false);
    await expect(run({ cwd: '/not-a-repo' })).rejects.toThrow('Not a git repository');
  });

  it('resolves refs and writes output to stdout', async () => {
    const writeSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    await run({ from: 'abc123', to: 'def456', format: 'text', include: ['pages/api'] });
    expect(mockGit.resolveRef).toHaveBeenCalledWith('abc123', expect.any(String));
    expect(mockGit.resolveRef).toHaveBeenCalledWith('def456', expect.any(String));
    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining('No changes detected.'));
    writeSpy.mockRestore();
  });

  it('filters changed files by include patterns', async () => {
    mockGit.getChangedFiles.mockResolvedValue(['pages/api/users.ts', 'components/Button.tsx']);
    const writeSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    await run({ include: ['pages/api'] });
    expect(mockGit.getFileAtCommit).toHaveBeenCalledTimes(2); // from + to for one matching file
    writeSpy.mockRestore();
  });
});
