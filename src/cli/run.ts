import { loadConfig } from '../config/loader';
import { getChangedFiles, getFileAtCommit, isGitRepository, resolveRef } from '../git/commits';
import { parseFiles } from '../parsers';
import { compareRoutes } from '../diff/compare';
import { generateReport, renderReport } from '../reporters/generate';
import type { RunOptions } from './types';

export async function run(options: RunOptions): Promise<void> {
  const cwd = options.cwd ?? process.cwd();

  if (!(await isGitRepository(cwd))) {
    throw new Error(`Not a git repository: ${cwd}`);
  }

  const config = await loadConfig(cwd);
  const merged = { ...config, ...options };

  const fromRef = await resolveRef(merged.from ?? 'HEAD~1', cwd);
  const toRef = await resolveRef(merged.to ?? 'HEAD', cwd);

  const changedFiles = await getChangedFiles(fromRef, toRef, cwd);
  const relevantFiles = changedFiles.filter((f) =>
    merged.include?.some((pattern) => f.includes(pattern))
  );

  const [fromContents, toContents] = await Promise.all([
    Promise.all(relevantFiles.map((f) => getFileAtCommit(fromRef, f, cwd).catch(() => null))),
    Promise.all(relevantFiles.map((f) => getFileAtCommit(toRef, f, cwd).catch(() => null))),
  ]);

  const fromRoutes = parseFiles(
    relevantFiles
      .map((f, i) => (fromContents[i] ? { path: f, content: fromContents[i]! } : null))
      .filter(Boolean) as { path: string; content: string }[]
  );

  const toRoutes = parseFiles(
    relevantFiles
      .map((f, i) => (toContents[i] ? { path: f, content: toContents[i]! } : null))
      .filter(Boolean) as { path: string; content: string }[]
  );

  const diff = compareRoutes(fromRoutes, toRoutes);
  const report = generateReport(diff, { from: fromRef, to: toRef });
  const output = renderReport(report, merged.format ?? 'text');

  process.stdout.write(output + '\n');
}
