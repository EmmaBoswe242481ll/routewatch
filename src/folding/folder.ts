import { RouteChange } from '../diff/types';

export interface FoldConfig {
  maxDepth: number;
  separator?: string;
}

export interface FoldResult {
  folded: RouteChange[];
  original: RouteChange[];
  foldedCount: number;
}

function getPathDepth(path: string, separator = '/'): number {
  return path.split(separator).filter(Boolean).length;
}

function foldPath(path: string, maxDepth: number, separator = '/'): string {
  const parts = path.split(separator).filter(Boolean);
  if (parts.length <= maxDepth) return path;
  return separator + parts.slice(0, maxDepth).join(separator) + separator + '...';
}

export function foldChanges(
  changes: RouteChange[],
  config: FoldConfig
): FoldResult {
  const { maxDepth, separator = '/' } = config;
  const folded: RouteChange[] = [];
  let foldedCount = 0;

  for (const change of changes) {
    const depth = getPathDepth(change.route.path, separator);
    if (depth > maxDepth) {
      foldedCount++;
      folded.push({
        ...change,
        route: {
          ...change.route,
          path: foldPath(change.route.path, maxDepth, separator),
        },
      });
    } else {
      folded.push(change);
    }
  }

  return { folded, original: changes, foldedCount };
}

export function formatFoldText(result: FoldResult): string {
  const lines: string[] = [
    `Folded ${result.foldedCount} of ${result.original.length} changes.`,
  ];
  for (const c of result.folded) {
    lines.push(`  [${c.type}] ${c.route.method} ${c.route.path}`);
  }
  return lines.join('\n');
}
