import { runCompare } from '../runner';
import * as commits from '../../git/commits';
import * as parser from '../../parsers/index';
import * as diff from '../../diff/compare';
import * as reporter from '../../reporters/generate';
import * as summary from '../../summary/builder';
import * as filter from '../../filters/route-filter';
import * as analyzer from '../../core/analyzer';
import * as cachedParser from '../../cache/cached-parser';

jest.mock('../../git/commits');
jest.mock('../../parsers/index');
jest.mock('../../diff/compare');
jest.mock('../../reporters/generate');
jest.mock('../../summary/builder');
jest.mock('../../filters/route-filter');
jest.mock('../../core/analyzer');
jest.mock('../../cache/cached-parser');

const mockCommits = commits as jest.Mocked<typeof commits>;
const mockDiff = diff as jest.Mocked<typeof diff>;
const mockReporter = reporter as jest.Mocked<typeof reporter>;
const mockSummary = summary as jest.Mocked<typeof summary>;
const mockAnalyzer = analyzer as jest.Mocked<typeof analyzer>;
const mockCachedParser = cachedParser as jest.Mocked<typeof cachedParser>;

const mockRoute = { method: 'GET', path: '/api/test', params: [] };
const mockDiffResult = { added: [mockRoute], removed: [], modified: [], unchanged: [] };
const mockReport = { routes: mockDiffResult, meta: {} } as any;
const mockSummaryResult = { totalChanges: 1 } as any;

beforeEach(() => {
  jest.clearAllMocks();
  mockCommits.getChangedFiles.mockResolvedValue(['pages/api/test.ts']);
  mockCommits.getFileAtCommit.mockResolvedValue('export default function handler() {}');
  mockAnalyzer.filterFiles.mockReturnValue(['pages/api/test.ts']);
  mockCachedParser.cachedParseFile.mockResolvedValue([mockRoute]);
  mockDiff.compareRoutes.mockReturnValue(mockDiffResult);
  mockReporter.generateReport.mockReturnValue(mockReport);
  mockSummary.buildSummary.mockReturnValue(mockSummaryResult);
});

describe('runCompare', () => {
  it('returns a CompareResult with correct counts', async () => {
    const result = await runCompare('/repo', {
      range: { from: 'abc123', to: 'def456' },
      useCache: true,
    });

    expect(result.added).toBe(1);
    expect(result.removed).toBe(0);
    expect(result.modified).toBe(0);
    expect(result.report).toBe(mockReport);
    expect(result.summary).toBe(mockSummaryResult);
  });

  it('calls filterRoutes when filters are provided', async () => {
    const mockFilterRoutes = filter.filterRoutes as jest.Mock;
    mockFilterRoutes.mockReturnValue([mockRoute]);

    await runCompare('/repo', {
      range: { from: 'abc123', to: 'def456' },
      filters: { methods: ['GET'] },
    });

    expect(mockFilterRoutes).toHaveBeenCalled();
  });

  it('skips filterRoutes when no filters are provided', async () => {
    const mockFilterRoutes = filter.filterRoutes as jest.Mock;

    await runCompare('/repo', {
      range: { from: 'abc123', to: 'def456' },
    });

    expect(mockFilterRoutes).not.toHaveBeenCalled();
  });

  it('handles empty changed files gracefully', async () => {
    mockCommits.getChangedFiles.mockResolvedValue([]);
    mockAnalyzer.filterFiles.mockReturnValue([]);
    mockDiff.compareRoutes.mockReturnValue({ added: [], removed: [], modified: [], unchanged: [] });

    const result = await runCompare('/repo', {
      range: { from: 'abc123', to: 'def456' },
    });

    expect(result.added).toBe(0);
    expect(result.removed).toBe(0);
  });
});
