import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getAuditPath,
  generateEntryId,
  loadAuditTrail,
  saveAuditTrail,
  appendAuditEntry,
  clearAuditTrail,
  AuditEntry,
} from '../trail';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-audit-'));
}

function makeEntry(overrides: Partial<AuditEntry> = {}): AuditEntry {
  return {
    id: 'test-id-1',
    timestamp: new Date().toISOString(),
    command: 'diff',
    fromRef: 'HEAD~1',
    toRef: 'HEAD',
    routesAdded: 2,
    routesRemoved: 1,
    routesModified: 0,
    durationMs: 320,
    ...overrides,
  };
}

describe('audit trail', () => {
  let tmpDir: string;
  let auditPath: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
    auditPath = path.join(tmpDir, 'audit.json');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('getAuditPath returns path under home by default', () => {
    const p = getAuditPath();
    expect(p).toContain('.routewatch');
    expect(p).toEndWith('audit.json');
  });

  it('getAuditPath uses provided dir', () => {
    expect(getAuditPath(tmpDir)).toBe(path.join(tmpDir, 'audit.json'));
  });

  it('generateEntryId returns unique strings', () => {
    const a = generateEntryId();
    const b = generateEntryId();
    expect(a).not.toBe(b);
    expect(typeof a).toBe('string');
  });

  it('loadAuditTrail returns empty trail when file missing', () => {
    const trail = loadAuditTrail(auditPath);
    expect(trail.version).toBe(1);
    expect(trail.entries).toHaveLength(0);
  });

  it('saveAuditTrail and loadAuditTrail round-trip', () => {
    const entry = makeEntry();
    saveAuditTrail(auditPath, { version: 1, entries: [entry] });
    const loaded = loadAuditTrail(auditPath);
    expect(loaded.entries).toHaveLength(1);
    expect(loaded.entries[0].id).toBe('test-id-1');
  });

  it('appendAuditEntry prepends newest entry', () => {
    appendAuditEntry(auditPath, makeEntry({ id: 'first' }));
    appendAuditEntry(auditPath, makeEntry({ id: 'second' }));
    const trail = loadAuditTrail(auditPath);
    expect(trail.entries[0].id).toBe('second');
    expect(trail.entries[1].id).toBe('first');
  });

  it('appendAuditEntry trims to maxEntries', () => {
    for (let i = 0; i < 5; i++) {
      appendAuditEntry(auditPath, makeEntry({ id: `entry-${i}` }), 3);
    }
    const trail = loadAuditTrail(auditPath);
    expect(trail.entries).toHaveLength(3);
  });

  it('clearAuditTrail resets entries', () => {
    appendAuditEntry(auditPath, makeEntry());
    clearAuditTrail(auditPath);
    const trail = loadAuditTrail(auditPath);
    expect(trail.entries).toHaveLength(0);
  });
});
