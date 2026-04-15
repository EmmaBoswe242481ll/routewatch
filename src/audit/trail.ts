import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface AuditEntry {
  id: string;
  timestamp: string;
  command: string;
  fromRef: string;
  toRef: string;
  routesAdded: number;
  routesRemoved: number;
  routesModified: number;
  outputPath?: string;
  durationMs: number;
}

export interface AuditTrail {
  version: number;
  entries: AuditEntry[];
}

export function getAuditPath(dir?: string): string {
  const base = dir ?? path.join(os.homedir(), '.routewatch');
  return path.join(base, 'audit.json');
}

export function generateEntryId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadAuditTrail(auditPath: string): AuditTrail {
  try {
    const raw = fs.readFileSync(auditPath, 'utf-8');
    return JSON.parse(raw) as AuditTrail;
  } catch {
    return { version: 1, entries: [] };
  }
}

export function saveAuditTrail(auditPath: string, trail: AuditTrail): void {
  const dir = path.dirname(auditPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(auditPath, JSON.stringify(trail, null, 2), 'utf-8');
}

export function appendAuditEntry(
  auditPath: string,
  entry: AuditEntry,
  maxEntries = 500
): void {
  const trail = loadAuditTrail(auditPath);
  trail.entries.unshift(entry);
  if (trail.entries.length > maxEntries) {
    trail.entries = trail.entries.slice(0, maxEntries);
  }
  saveAuditTrail(auditPath, trail);
}

export function clearAuditTrail(auditPath: string): void {
  saveAuditTrail(auditPath, { version: 1, entries: [] });
}

/**
 * Returns audit entries filtered by a date range (inclusive).
 * @param trail - The audit trail to filter.
 * @param from - Start of the date range.
 * @param to - End of the date range.
 */
export function filterEntriesByDateRange(
  trail: AuditTrail,
  from: Date,
  to: Date
): AuditEntry[] {
  return trail.entries.filter((entry) => {
    const ts = new Date(entry.timestamp);
    return ts >= from && ts <= to;
  });
}
