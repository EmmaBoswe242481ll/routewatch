import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  saveSnapshot,
  loadSnapshot,
  listSnapshots,
  deleteSnapshot,
  generateSnapshotId,
  getSnapshotDir,
} from '../store';
import { RouteSnapshot } from '../types';

let tmpDir: string;

function makeOptions() {
  return { dir: path.join(tmpDir, 'snapshots') };
}

function makeSnapshot(overrides: Partial<RouteSnapshot> = {}): RouteSnapshot {
  return {
    id: generateSnapshotId('abc123', 'main'),
    timestamp: Date.now(),
    commitHash: 'abc123',
    branch: 'main',
    routes: [
      { path: '/api/users', method: 'GET', params: [], file: 'pages/api/users.ts', framework: 'nextjs' },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-snapshot-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('getSnapshotDir', () => {
  it('returns default dir when no option provided', () => {
    const dir = getSnapshotDir();
    expect(dir).toContain('.routewatch/snapshots');
  });

  it('returns custom dir when provided', () => {
    const dir = getSnapshotDir({ dir: '/custom/path' });
    expect(dir).toBe('/custom/path');
  });
});

describe('generateSnapshotId', () => {
  it('returns a 12-char hex string', () => {
    const id = generateSnapshotId('abc', 'main');
    expect(id).toHaveLength(12);
    expect(id).toMatch(/^[0-9a-f]+$/);
  });
});

describe('saveSnapshot / loadSnapshot', () => {
  it('saves and loads a snapshot by id', () => {
    const opts = makeOptions();
    const snap = makeSnapshot();
    saveSnapshot(snap, opts);
    const loaded = loadSnapshot(snap.id, opts);
    expect(loaded).toEqual(snap);
  });

  it('returns null for unknown id', () => {
    const opts = makeOptions();
    expect(loadSnapshot('nonexistent', opts)).toBeNull();
  });
});

describe('listSnapshots', () => {
  it('returns empty array when no snapshots exist', () => {
    expect(listSnapshots(makeOptions())).toEqual([]);
  });

  it('lists all saved snapshots sorted by timestamp desc', () => {
    const opts = makeOptions();
    const s1 = makeSnapshot({ id: generateSnapshotId('a', 'main'), timestamp: 1000 });
    const s2 = makeSnapshot({ id: generateSnapshotId('b', 'main'), timestamp: 2000 });
    saveSnapshot(s1, opts);
    saveSnapshot(s2, opts);
    const list = listSnapshots(opts);
    expect(list).toHaveLength(2);
    expect(list[0].timestamp).toBeGreaterThanOrEqual(list[1].timestamp);
  });
});

describe('deleteSnapshot', () => {
  it('deletes an existing snapshot and returns true', () => {
    const opts = makeOptions();
    const snap = makeSnapshot();
    saveSnapshot(snap, opts);
    expect(deleteSnapshot(snap.id, opts)).toBe(true);
    expect(loadSnapshot(snap.id, opts)).toBeNull();
  });

  it('returns false when snapshot does not exist', () => {
    expect(deleteSnapshot('ghost', makeOptions())).toBe(false);
  });
});
