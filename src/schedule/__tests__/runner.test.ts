import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getStatePath,
  loadState,
  saveState,
  initState,
  recordRun,
  cronFromFrequency,
  buildRunRecord,
} from '../runner';
import { ScheduleOptions } from '../types';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-schedule-'));
}

const baseOptions: ScheduleOptions = { frequency: 'daily' };

describe('getStatePath', () => {
  it('returns path inside given dir', () => {
    expect(getStatePath('/some/dir')).toBe('/some/dir/.routewatch-schedule.json');
  });
});

describe('loadState', () => {
  it('returns null when file does not exist', () => {
    const dir = makeTempDir();
    expect(loadState(dir)).toBeNull();
    fs.rmSync(dir, { recursive: true });
  });

  it('returns parsed state when file exists', () => {
    const dir = makeTempDir();
    const state = initState(baseOptions);
    saveState(dir, state);
    const loaded = loadState(dir);
    expect(loaded).not.toBeNull();
    expect(loaded!.options.frequency).toBe('daily');
    fs.rmSync(dir, { recursive: true });
  });
});

describe('initState', () => {
  it('creates state with empty runs array', () => {
    const state = initState(baseOptions);
    expect(state.runs).toHaveLength(0);
    expect(state.lastRun).toBeUndefined();
  });
});

describe('recordRun', () => {
  it('appends run and updates lastRun', () => {
    const state = initState(baseOptions);
    const run = buildRunRecord('2024-01-01T00:00:00Z', '2024-01-01T00:00:01Z', '2024-01-01T00:00:05Z', true);
    const updated = recordRun(state, run);
    expect(updated.runs).toHaveLength(1);
    expect(updated.lastRun).toBeDefined();
    expect(updated.lastRun!.success).toBe(true);
    expect(updated.lastRun!.id).toBeTruthy();
  });

  it('keeps at most 50 runs', () => {
    let state = initState(baseOptions);
    for (let i = 0; i < 55; i++) {
      const run = buildRunRecord('t', 't', 't', true);
      state = recordRun(state, run);
    }
    expect(state.runs.length).toBe(50);
  });
});

describe('cronFromFrequency', () => {
  it('returns correct cron for hourly', () => {
    expect(cronFromFrequency('hourly')).toBe('0 * * * *');
  });

  it('returns correct cron for daily', () => {
    expect(cronFromFrequency('daily')).toBe('0 0 * * *');
  });

  it('returns correct cron for weekly', () => {
    expect(cronFromFrequency('weekly')).toBe('0 0 * * 0');
  });

  it('returns custom cron expression', () => {
    expect(cronFromFrequency('custom', '*/15 * * * *')).toBe('*/15 * * * *');
  });

  it('throws when custom frequency has no cron', () => {
    expect(() => cronFromFrequency('custom')).toThrow();
  });

  it('throws for unknown frequency', () => {
    expect(() => cronFromFrequency('monthly')).toThrow();
  });
});
