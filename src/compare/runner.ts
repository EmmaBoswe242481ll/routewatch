import { CompareOptions, CompareResult } from './types';
import { getFileAtCommit, getChangedFiles } from '../git/commits';
import { parseFiles } from '../parsers/index';
import { compareRoutes } from '../diff/compare';
import { generateReport } from '../reporters/generate';
import { buildSummary } from '../summary/builder';
import { filterRoutes } from '../filters/route-filter';
import { cachedParseFile } from '../cache/cached-parser';
import { filterFiles } from '../core/analyzer';
import path from 'path';

export async function runCompare(
  repoPath: string,
  options: CompareOptions
): Promise<CompareResult> {
  const { range, framework = 'auto', filters, useCache = true } = options;

  const changedFiles = await getChangedFiles(repoPath, range.from, range.to);
  const relevantFiles = filterFiles(changedFiles, framework);

  const parseFileFn = useCache ? cachedParseFile : parseFiles;

  const fromRoutes = await resolveRoutesAtRef(
    repoPath,
    relevantFiles,
    range.from,
    framework,
    useCache
  );

  const toRoutes = await resolveRoutesAtRef(
    repoPath,
    relevantFiles,
    range.to,
    framework,
    useCache
  );

  let diffResult = compareRoutes(fromRoutes, toRoutes);

  if (filters) {
    diffResult = {
      ...diffResult,
      added: filterRoutes(diffResult.added, filters),
      removed: filterRoutes(diffResult.removed, filters),
      modified: filterRoutes(diffResult.modified, filters),
    };
  }

  const report = generateReport(diffResult, range);
  const summary = buildSummary(report);

  return {
    range,
    added: diffResult.added.length,
    removed: diffResult.removed.length,
    modified: diffResult.modified.length,
    unchanged: diffResult.unchanged?.length ?? 0,
    report,
    summary,
  };
}

async function resolveRoutesAtRef(
  repoPath: string,
  files: string[],
  ref: string,
  framework: string,
  useCache: boolean
) {
  const contents = await Promise.all(
    files.map(async (file) => {
      const content = await getFileAtCommit(repoPath, ref, file);
      return { file, content };
    })
  );

  const valid = contents.filter((c) => c.content !== null);

  if (useCache) {
    const results = await Promise.all(
      valid.map(({ file, content }) =>
        cachedParseFile(file, content as string, framework as any)
      )
    );
    return results.flat();
  }

  return parseFiles(
    valid.map((v) => ({ path: v.file, content: v.content as string })),
    framework as any
  );
}
