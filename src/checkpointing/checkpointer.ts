import * as fs from 'fs';
import * as path from 'path';
import { RouteChange } from '../diff/types';

export interface Checkpoint {
  id: string;
  label: string;
  timestamp: number;
  changes: RouteChange[];
  meta?: Record<string, unknown>;
}

export interface CheckpointStore {
  checkpoints: Checkpoint[];
}

export function getCheckpointPath(dir: string): string {
  return path.join(dir, '.routewatch', 'checkpoints.json');
}

export function generateCheckpointId(): string {
  return `cp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function loadCheckpoints(dir: string): CheckpointStore {
  const filePath = getCheckpointPath(dir);
  if (!fs.existsSync(filePath)) {
    return { checkpoints: [] };
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as CheckpointStore;
  } catch {
    return { checkpoints: [] };
  }
}

export function saveCheckpoints(dir: string, store: CheckpointStore): void {
  const filePath = getCheckpointPath(dir);
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

export function createCheckpoint(
  dir: string,
  label: string,
  changes: RouteChange[],
  meta?: Record<string, unknown>
): Checkpoint {
  const store = loadCheckpoints(dir);
  const checkpoint: Checkpoint = {
    id: generateCheckpointId(),
    label,
    timestamp: Date.now(),
    changes,
    meta,
  };
  store.checkpoints.push(checkpoint);
  saveCheckpoints(dir, store);
  return checkpoint;
}

export function findCheckpoint(dir: string, idOrLabel: string): Checkpoint | undefined {
  const store = loadCheckpoints(dir);
  return store.checkpoints.find(
    (cp) => cp.id === idOrLabel || cp.label === idOrLabel
  );
}

export function deleteCheckpoint(dir: string, idOrLabel: string): boolean {
  const store = loadCheckpoints(dir);
  const before = store.checkpoints.length;
  store.checkpoints = store.checkpoints.filter(
    (cp) => cp.id !== idOrLabel && cp.label !== idOrLabel
  );
  if (store.checkpoints.length < before) {
    saveCheckpoints(dir, store);
    return true;
  }
  return false;
}

export function formatCheckpointText(checkpoint: Checkpoint): string {
  const date = new Date(checkpoint.timestamp).toISOString();
  const lines: string[] = [
    `Checkpoint: ${checkpoint.label} (${checkpoint.id})`,
    `Created:    ${date}`,
    `Changes:    ${checkpoint.changes.length}`,
  ];
  if (checkpoint.meta && Object.keys(checkpoint.meta).length > 0) {
    lines.push(`Meta:       ${JSON.stringify(checkpoint.meta)}`);
  }
  return lines.join('\n');
}
