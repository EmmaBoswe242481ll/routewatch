import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  createCheckpoint,
  findCheckpoint,
  deleteCheckpoint,
  loadCheckpoints,
  formatCheckpointText,
  getCheckpointPath,
} from '../checkpointer';
import { RouteChange } from '../../diff/types';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'rw-checkpoint-'));
}

function makeChange(overrides: Partial<RouteChange> = {}): RouteChange {
  return {
    type: 'added',
    route: { method: 'GET', path: '/api/test', params: [] },
    ...overrides,
  } as RouteChange;
}

describe('checkpointer', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty store when no file exists', () => {
    const store = loadCheckpoints(tmpDir);
    expect(store.checkpoints).toEqual([]);
  });

  it('creates and persists a checkpoint', () => {
    const changes = [makeChange()];
    const cp = createCheckpoint(tmpDir, 'v1', changes, { commit: 'abc123' });
    expect(cp.label).toBe('v1');
    expect(cp.changes).toHaveLength(1);
    expect(cp.id).toMatch(/^cp_/);
    expect(fs.existsSync(getCheckpointPath(tmpDir))).toBe(true);
  });

  it('finds a checkpoint by label', () => {
    createCheckpoint(tmpDir, 'release-1', [makeChange()]);
    const found = findCheckpoint(tmpDir, 'release-1');
    expect(found).toBeDefined();
    expect(found?.label).toBe('release-1');
  });

  it('finds a checkpoint by id', () => {
    const cp = createCheckpoint(tmpDir, 'release-2', [makeChange()]);
    const found = findCheckpoint(tmpDir, cp.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(cp.id);
  });

  it('returns undefined for unknown label', () => {
    createCheckpoint(tmpDir, 'existing', []);
    expect(findCheckpoint(tmpDir, 'nonexistent')).toBeUndefined();
  });

  it('deletes a checkpoint by label', () => {
    createCheckpoint(tmpDir, 'to-delete', [makeChange()]);
    const result = deleteCheckpoint(tmpDir, 'to-delete');
    expect(result).toBe(true);
    expect(findCheckpoint(tmpDir, 'to-delete')).toBeUndefined();
  });

  it('returns false when deleting non-existent checkpoint', () => {
    const result = deleteCheckpoint(tmpDir, 'ghost');
    expect(result).toBe(false);
  });

  it('formats checkpoint text correctly', () => {
    const cp = createCheckpoint(tmpDir, 'fmt-test', [makeChange(), makeChange()]);
    const text = formatCheckpointText(cp);
    expect(text).toContain('fmt-test');
    expect(text).toContain('Changes:    2');
    expect(text).toContain(cp.id);
  });

  it('includes meta in formatted text when present', () => {
    const cp = createCheckpoint(tmpDir, 'with-meta', [], { env: 'prod' });
    const text = formatCheckpointText(cp);
    expect(text).toContain('Meta:');
    expect(text).toContain('prod');
  });
});
