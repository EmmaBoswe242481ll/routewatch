import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ParsedRoute } from '../parsers/types';

export interface CacheEntry {
  commitHash: string;
  timestamp: number;
  routes: ParsedRoute[];
  fileHash: string;
}

export interface CacheStore {
  [key: string]: CacheEntry;
}

const DEFAULT_CACHE_DIR = '.routewatch-cache';

export function getCachePath(cacheDir: string = DEFAULT_CACHE_DIR): string {
  return path.resolve(process.cwd(), cacheDir, 'routes.json');
}

export function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

export function loadCache(cacheDir?: string): CacheStore {
  const cachePath = getCachePath(cacheDir);
  if (!fs.existsSync(cachePath)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(cachePath, 'utf-8');
    return JSON.parse(raw) as CacheStore;
  } catch {
    return {};
  }
}

export function saveCache(store: CacheStore, cacheDir?: string): void {
  const cachePath = getCachePath(cacheDir);
  const dir = path.dirname(cachePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(cachePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function getCacheKey(commitHash: string, filePath: string): string {
  return `${commitHash}:${filePath}`;
}

export function getEntry(store: CacheStore, commitHash: string, filePath: string): CacheEntry | undefined {
  return store[getCacheKey(commitHash, filePath)];
}

export function setEntry(store: CacheStore, commitHash: string, filePath: string, entry: CacheEntry): void {
  store[getCacheKey(commitHash, filePath)] = entry;
}

export function pruneCache(store: CacheStore, maxEntries: number = 500): CacheStore {
  const keys = Object.keys(store);
  if (keys.length <= maxEntries) return store;
  const sorted = keys.sort((a, b) => store[a].timestamp - store[b].timestamp);
  const toRemove = sorted.slice(0, keys.length - maxEntries);
  const pruned: CacheStore = { ...store };
  toRemove.forEach((k) => delete pruned[k]);
  return pruned;
}
