import { createHash } from 'crypto';
import type { RouteChange } from '../diff/types';

export interface HashOptions {
  algorithm?: 'md5' | 'sha1' | 'sha256';
  includeMethod?: boolean;
  includePath?: boolean;
  includeParams?: boolean;
}

export interface HashedChange {
  change: RouteChange;
  hash: string;
}

export function hashChange(
  change: RouteChange,
  options: HashOptions = {}
): string {
  const {
    algorithm = 'sha256',
    includeMethod = true,
    includePath = true,
    includeParams = true,
  } = options;

  const parts: string[] = [];
  if (includeMethod) parts.push(change.method);
  if (includePath) parts.push(change.path);
  if (includeParams && change.params) parts.push(change.params.join(','));
  parts.push(change.type);

  return createHash(algorithm).update(parts.join('|')).digest('hex');
}

export function hashChanges(
  changes: RouteChange[],
  options: HashOptions = {}
): HashedChange[] {
  return changes.map((change) => ({
    change,
    hash: hashChange(change, options),
  }));
}

export function deduplicateByHash(
  hashed: HashedChange[]
): HashedChange[] {
  const seen = new Set<string>();
  return hashed.filter(({ hash }) => {
    if (seen.has(hash)) return false;
    seen.add(hash);
    return true;
  });
}

export function formatHashText(hashed: HashedChange[]): string {
  const lines = hashed.map(
    ({ change, hash }) =>
      `${hash.slice(0, 8)}  [${change.method}] ${change.path} (${change.type})`
  );
  return [`Hashed Changes (${hashed.length}):`, ...lines].join('\n');
}
