import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  loadCache,
  saveCache,
  getCacheKey,
  getEntry,
  setEntry,
  pruneCache,
  hashContent,
  CacheStore,
  CacheEntry,
} from '../store';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-cache-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const makeEntry = (commitHash: string): CacheEntry => ({
  commitHash,
  timestamp: Date.now(),
  routes: [],
  fileHash: 'abc123',
});

describe('hashContent', () => {
  it('returns a 16-char hex string', () => {
    const h = hashContent('hello world');
    expect(h).toHaveLength(16);
    expect(h).toMatch(/^[0-9a-f]+$/);
  });

  it('produces different hashes for different content', () => {
    expect(hashContent('foo')).not.toBe(hashContent('bar'));
  });
});

describe('loadCache / saveCache', () => {
  it('returns empty object when cache file does not exist', () => {
    const store = loadCache(path.join(tmpDir, 'nonexistent'));
    expect(store).toEqual({});
  });

  it('round-trips a cache store', () => {
    const store: CacheStore = {};
    setEntry(store, 'abc', 'src/pages/index.ts', makeEntry('abc'));
    saveCache(store, tmpDir);
    const loaded = loadCache(tmpDir);
    expect(Object.keys(loaded)).toHaveLength(1);
    expect(loaded['abc:src/pages/index.ts'].commitHash).toBe('abc');
  });

  it('returns empty object on malformed JSON', () => {
    const cacheDir = path.join(tmpDir, 'bad');
    fs.mkdirSync(cacheDir);
    fs.writeFileSync(path.join(cacheDir, 'routes.json'), 'NOT JSON');
    const store = loadCache(cacheDir);
    expect(store).toEqual({});
  });
});

describe('getCacheKey', () => {
  it('combines commitHash and filePath', () => {
    expect(getCacheKey('deadbeef', 'src/app/page.tsx')).toBe('deadbeef:src/app/page.tsx');
  });
});

describe('getEntry / setEntry', () => {
  it('sets and retrieves an entry', () => {
    const store: CacheStore = {};
    const entry = makeEntry('sha1');
    setEntry(store, 'sha1', 'file.ts', entry);
    expect(getEntry(store, 'sha1', 'file.ts')).toEqual(entry);
  });

  it('returns undefined for missing entry', () => {
    expect(getEntry({}, 'x', 'y')).toBeUndefined();
  });
});

describe('pruneCache', () => {
  it('removes oldest entries when over limit', () => {
    const store: CacheStore = {};
    for (let i = 0; i < 10; i++) {
      store[`key${i}`] = { commitHash: `h${i}`, timestamp: i, routes: [], fileHash: 'x' };
    }
    const pruned = pruneCache(store, 5);
    expect(Object.keys(pruned)).toHaveLength(5);
    expect(pruned['key9']).toBeDefined();
    expect(pruned['key0']).toBeUndefined();
  });

  it('returns store unchanged when under limit', () => {
    const store: CacheStore = { key1: makeEntry('h1') };
    expect(pruneCache(store, 100)).toBe(store);
  });
});
