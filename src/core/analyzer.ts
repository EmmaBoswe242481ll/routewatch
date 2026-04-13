import { getFileAtCommit, getChangedFiles } from '../git/commits';
import { parseFiles } from '../parsers';
import { compareRoutes } from '../diff/compare';
import { generateReport } from '../reporters/generate';
import { RouteInfo } from '../parsers/types';
import { RouteDiff } from '../diff/types';
import { Report } from '../reporters/types';

export interface AnalyzerOptions {
  fromRef: string;
  toRef: string;
  repoPath: string;
  framework: 'nextjs' | 'express' | 'auto';
  include?: string[];
  exclude?: string[];
}

export interface AnalyzerResult {
  report: Report;
  diffs: RouteDiff[];
  fromRoutes: RouteInfo[];
  toRoutes: RouteInfo[];
}

async function getRoutesAtRef(
  ref: string,
  files: string[],
  repoPath: string,
  framework: AnalyzerOptions['framework']
): Promise<RouteInfo[]> {
  const fileContents = await Promise.all(
    files.map(async (file) => ({
      path: file,
      content: await getFileAtCommit(repoPath, ref, file),
    }))
  );

  const validFiles = fileContents.filter((f) => f.content !== null) as {
    path: string;
    content: string;
  }[];

  return parseFiles(validFiles, framework === 'auto' ? undefined : framework);
}

export async function analyzeCommits(
  options: AnalyzerOptions
): Promise<AnalyzerResult> {
  const { fromRef, toRef, repoPath, framework, include, exclude } = options;

  const changedFiles = await getChangedFiles(repoPath, fromRef, toRef);

  const filteredFiles = changedFiles.filter((file) => {
    if (include && !include.some((pattern) => file.includes(pattern))) return false;
    if (exclude && exclude.some((pattern) => file.includes(pattern))) return false;
    return true;
  });

  const [fromRoutes, toRoutes] = await Promise.all([
    getRoutesAtRef(fromRef, filteredFiles, repoPath, framework),
    getRoutesAtRef(toRef, filteredFiles, repoPath, framework),
  ]);

  const diffs = compareRoutes(fromRoutes, toRoutes);
  const report = generateReport(fromRef, toRef, diffs);

  return { report, diffs, fromRoutes, toRoutes };
}
