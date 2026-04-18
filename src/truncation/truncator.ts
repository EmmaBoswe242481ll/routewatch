import { RouteChange } from '../diff/types';

export interface TruncationOptions {
  maxChanges?: number;
  maxPathLength?: number;
  ellipsis?: string;
}

export interface TruncationResult {
  changes: RouteChange[];
  original: number;
  truncated: number;
  pathsTruncated: number;
}

export function truncatePath(path: string, maxLength: number, ellipsis = '...'): string {
  if (path.length <= maxLength) return path;
  return path.slice(0, maxLength - ellipsis.length) + ellipsis;
}

export function truncateChanges(
  changes: RouteChange[],
  options: TruncationOptions = {}
): TruncationResult {
  const { maxChanges, maxPathLength = 80, ellipsis = '...' } = options;

  let pathsTruncated = 0;

  let result = changes.map((change) => {
    const truncated = truncatePath(change.path, maxPathLength, ellipsis);
    if (truncated !== change.path) {
      pathsTruncated++;
      return { ...change, path: truncated };
    }
    return change;
  });

  const original = result.length;

  if (maxChanges !== undefined && result.length > maxChanges) {
    result = result.slice(0, maxChanges);
  }

  return {
    changes: result,
    original,
    truncated: original - result.length,
    pathsTruncated,
  };
}

export function formatTruncationText(result: TruncationResult): string {
  const lines: string[] = [];
  lines.push(`Truncation Summary:`);
  lines.push(`  Total input changes : ${result.original}`);
  lines.push(`  Changes removed     : ${result.truncated}`);
  lines.push(`  Paths truncated     : ${result.pathsTruncated}`);
  lines.push(`  Remaining changes   : ${result.changes.length}`);
  return lines.join('\n');
}
