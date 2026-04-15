import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ScheduleOptions, ScheduledRun, ScheduleState } from './types';

const STATE_FILENAME = '.routewatch-schedule.json';

export function getStatePath(dir: string): string {
  return path.join(dir, STATE_FILENAME);
}

export function loadState(dir: string): ScheduleState | null {
  const statePath = getStatePath(dir);
  if (!fs.existsSync(statePath)) return null;
  try {
    const raw = fs.readFileSync(statePath, 'utf-8');
    return JSON.parse(raw) as ScheduleState;
  } catch {
    return null;
  }
}

export function saveState(dir: string, state: ScheduleState): void {
  const statePath = getStatePath(dir);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
}

export function initState(options: ScheduleOptions): ScheduleState {
  return { options, runs: [] };
}

export function recordRun(
  state: ScheduleState,
  run: Omit<ScheduledRun, 'id'>
): ScheduleState {
  const entry: ScheduledRun = { id: uuidv4(), ...run };
  const runs = [...state.runs, entry].slice(-50); // keep last 50
  return { ...state, lastRun: entry, runs };
}

export function cronFromFrequency(frequency: string, custom?: string): string {
  switch (frequency) {
    case 'hourly':
      return '0 * * * *';
    case 'daily':
      return '0 0 * * *';
    case 'weekly':
      return '0 0 * * 0';
    case 'custom':
      if (!custom) throw new Error('cron expression required for custom frequency');
      return custom;
    default:
      throw new Error(`Unknown frequency: ${frequency}`);
  }
}

export function buildRunRecord(
  scheduledAt: string,
  startedAt: string,
  finishedAt: string,
  success: boolean,
  outputPath?: string,
  error?: string
): Omit<ScheduledRun, 'id'> {
  return { scheduledAt, startedAt, finishedAt, success, outputPath, error };
}
