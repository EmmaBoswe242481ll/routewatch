import { execSync } from 'child_process';

export interface CommitInfo {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
}

export interface CommitRange {
  from: string;
  to: string;
}

export function getCommitInfo(hash: string, cwd: string = process.cwd()): CommitInfo {
  const format = '%H|%h|%s|%an|%aI';
  const output = execSync(`git log -1 --format="${format}" ${hash}`, { cwd })
    .toString()
    .trim();

  const [fullHash, shortHash, message, author, date] = output.split('|');
  return { hash: fullHash, shortHash, message, author, date };
}

export function resolveRef(ref: string, cwd: string = process.cwd()): string {
  return execSync(`git rev-parse ${ref}`, { cwd }).toString().trim();
}

export function getChangedFiles(
  range: CommitRange,
  cwd: string = process.cwd()
): string[] {
  const output = execSync(
    `git diff --name-only ${range.from} ${range.to}`,
    { cwd }
  )
    .toString()
    .trim();

  if (!output) return [];
  return output.split('\n').filter(Boolean);
}

export function isGitRepository(cwd: string = process.cwd()): boolean {
  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function getFileAtCommit(
  filePath: string,
  hash: string,
  cwd: string = process.cwd()
): string | null {
  try {
    return execSync(`git show ${hash}:${filePath}`, { cwd }).toString();
  } catch {
    return null;
  }
}
