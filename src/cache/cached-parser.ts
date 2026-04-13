import { ParsedRoute } from '../parsers/types';
import { parseFile } from '../parsers';
import { loadCache, saveCache, getEntry, setEntry, hashContent, pruneCache, CacheStore } from './store';

export interface CachedParseOptions {
  cacheDir?: string;
  maxEntries?: number;
}

let _store: CacheStore | null = null;
let _cacheDir: string | undefined;

function getStore(cacheDir?: string): CacheStore {
  if (_store === null || _cacheDir !== cacheDir) {
    _store = loadCache(cacheDir);
    _cacheDir = cacheDir;
  }
  return _store;
}

export function cachedParseFile(
  filePath: string,
  content: string,
  commitHash: string,
  options: CachedParseOptions = {}
): ParsedRoute[] {
  const store = getStore(options.cacheDir);
  const fileHash = hashContent(content);
  const cached = getEntry(store, commitHash, filePath);

  if (cached && cached.fileHash === fileHash) {
    return cached.routes;
  }

  const routes = parseFile(filePath, content);
  setEntry(store, commitHash, filePath, {
    commitHash,
    timestamp: Date.now(),
    routes,
    fileHash,
  });

  return routes;
}

export function flushCache(options: CachedParseOptions = {}): void {
  if (_store === null) return;
  const pruned = pruneCache(_store, options.maxEntries ?? 500);
  saveCache(pruned, options.cacheDir);
  _store = pruned;
}

export function resetCacheStore(): void {
  _store = null;
  _cacheDir = undefined;
}
