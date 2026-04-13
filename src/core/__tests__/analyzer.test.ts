import { analyzeCommits, AnalyzerOptions } from '../analyzer';
import * as commits from '../../git/commits';
import * as parsers from '../../parsers';
import * as compare from '../../diff/compare';
import * as generate from '../../reporters/generate';

jest.mock('../../git/commits');
jest.mock('../../parsers');
jest.mock('../../diff/compare');
jest.mock('../../reporters/generate');

const mockGetChangedFiles = commits.getChangedFiles as jest.MockedFunction<typeof commits.getChangedFiles>;
const mockGetFileAtCommit = commits.getFileAtCommit as jest.MockedFunction<typeof commits.getFileAtCommit>;
const mockParseFiles = parsers.parseFiles as jest.MockedFunction<typeof parsers.parseFiles>;
const mockCompareRoutes = compare.compareRoutes as jest.MockedFunction<typeof compare.compareRoutes>;
const mockGenerateReport = generate.generateReport as jest.MockedFunction<typeof generate.generateReport>;

const baseOptions: AnalyzerOptions = {
  fromRef: 'abc123',
  toRef: 'def456',
  repoPath: '/repo',
  framework: 'nextjs',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetChangedFiles.mockResolvedValue(['pages/api/users.ts', 'pages/api/posts.ts']);
  mockGetFileAtCommit.mockResolvedValue('export default function handler() {}');
  mockParseFiles.mockReturnValue([{ method: 'GET', path: '/api/users', params: [], framework: 'nextjs', filePath: 'pages/api/users.ts' }]);
  mockCompareRoutes.mockReturnValue([]);
  mockGenerateReport.mockReturnValue({ fromRef: 'abc123', toRef: 'def456', generatedAt: '', summary: { added: 0, removed: 0, modified: 0, total: 0 }, diffs: [] });
});

describe('analyzeCommits', () => {
  it('returns analyzer result with report and diffs', async () => {
    const result = await analyzeCommits(baseOptions);
    expect(result).toHaveProperty('report');
    expect(result).toHaveProperty('diffs');
    expect(result).toHaveProperty('fromRoutes');
    expect(result).toHaveProperty('toRoutes');
  });

  it('calls getChangedFiles with correct args', async () => {
    await analyzeCommits(baseOptions);
    expect(mockGetChangedFiles).toHaveBeenCalledWith('/repo', 'abc123', 'def456');
  });

  it('filters files based on include option', async () => {
    await analyzeCommits({ ...baseOptions, include: ['api/users'] });
    expect(mockGetFileAtCommit).toHaveBeenCalledWith('/repo', expect.any(String), 'pages/api/users.ts');
    expect(mockGetFileAtCommit).not.toHaveBeenCalledWith('/repo', expect.any(String), 'pages/api/posts.ts');
  });

  it('filters files based on exclude option', async () => {
    await analyzeCommits({ ...baseOptions, exclude: ['posts'] });
    expect(mockGetFileAtCommit).not.toHaveBeenCalledWith('/repo', expect.any(String), 'pages/api/posts.ts');
  });

  it('skips files with null content', async () => {
    mockGetFileAtCommit.mockResolvedValue(null);
    const result = await analyzeCommits(baseOptions);
    expect(mockParseFiles).toHaveBeenCalledWith([], expect.anything());
    expect(result.fromRoutes).toBeDefined();
  });
});
