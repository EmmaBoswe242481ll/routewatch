import fs from 'fs';
import path from 'path';
import os from 'os';
import { findConfigFile, loadConfig, mergeConfig } from '../loader';
import { DEFAULT_CONFIG } from '../schema';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-test-'));
}

function cleanup(dir: string) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('findConfigFile', () => {
  it('returns null when no config file exists', () => {
    const dir = makeTempDir();
    expect(findConfigFile(dir)).toBeNull();
    cleanup(dir);
  });

  it('finds routewatch.config.json', () => {
    const dir = makeTempDir();
    const filePath = path.join(dir, 'routewatch.config.json');
    fs.writeFileSync(filePath, '{}');
    expect(findConfigFile(dir)).toBe(filePath);
    cleanup(dir);
  });
});

describe('loadConfig', () => {
  it('returns DEFAULT_CONFIG when no file found', () => {
    const dir = makeTempDir();
    const config = loadConfig(undefined, dir);
    expect(config).toEqual(DEFAULT_CONFIG);
    cleanup(dir);
  });

  it('loads and parses a valid config file', () => {
    const dir = makeTempDir();
    const filePath = path.join(dir, 'routewatch.config.json');
    fs.writeFileSync(filePath, JSON.stringify({ framework: 'nextjs', outputFormat: 'json' }));
    const config = loadConfig(undefined, dir);
    expect(config.framework).toBe('nextjs');
    expect(config.outputFormat).toBe('json');
    cleanup(dir);
  });

  it('returns DEFAULT_CONFIG on invalid config values', () => {
    const dir = makeTempDir();
    const filePath = path.join(dir, 'routewatch.config.json');
    fs.writeFileSync(filePath, JSON.stringify({ framework: 'unknown-framework' }));
    const config = loadConfig(undefined, dir);
    expect(config).toEqual(DEFAULT_CONFIG);
    cleanup(dir);
  });
});

describe('mergeConfig', () => {
  it('merges overrides into base config', () => {
    const merged = mergeConfig(DEFAULT_CONFIG, { framework: 'express' });
    expect(merged.framework).toBe('express');
    expect(merged.outputFormat).toBe(DEFAULT_CONFIG.outputFormat);
  });
});
