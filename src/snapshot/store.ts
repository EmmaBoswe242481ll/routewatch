import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { RouteSnapshot, SnapshotStoreOptions } from './types';

const DEFAULT_SNAPSHOT_DIR = '.routewatch/snapshots';
const DEFAULT_MAX_SNAPSHOTS = 20;

export function getSnapshotDir(options: SnapshotStoreOptions = {}): string {
  return path.resolve(process.cwd(), options.dir ?? DEFAULT_SNAPSHOT_DIR);
}

export function generateSnapshotId(commitHash: string, branch: string): string {
  const raw = `${commitHash}:${branch}:${Date.now()}`;
  return crypto.createHash('sha1').update(raw).digest('hex').slice(0, 12);
}

export function saveSnapshot(
  snapshot: RouteSnapshot,
  options: SnapshotStoreOptions = {}
): string {
  const dir = getSnapshotDir(options);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const filePath = path.join(dir, `${snapshot.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
  pruneSnapshots(dir, options.maxSnapshots ?? DEFAULT_MAX_SNAPSHOTS);
  return filePath;
}

export function loadSnapshot(
  id: string,
  options: SnapshotStoreOptions = {}
): RouteSnapshot | null {
  const filePath = path.join(getSnapshotDir(options), `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as RouteSnapshot;
  } catch {
    return null;
  }
}

export function listSnapshots(options: SnapshotStoreOptions = {}): RouteSnapshot[] {
  const dir = getSnapshotDir(options);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')) as RouteSnapshot;
      } catch {
        return null;
      }
    })
    .filter((s): s is RouteSnapshot => s !== null)
    .sort((a, b) => b.timestamp - a.timestamp);
}

export function deleteSnapshot(id: string, options: SnapshotStoreOptions = {}): boolean {
  const filePath = path.join(getSnapshotDir(options), `${id}.json`);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

function pruneSnapshots(dir: string, max: number): void {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({ name: f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  files.slice(max).forEach(({ name }) => fs.unlinkSync(path.join(dir, name)));
}
