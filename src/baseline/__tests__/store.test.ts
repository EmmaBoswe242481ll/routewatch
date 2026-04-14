import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  getBaselinePath,
  saveBaseline,
  loadBaseline,
  deleteBaseline,
  baselineExists,
} from '../store';
import { RouteInfo } from '../../parsers/types';

const sampleRoutes: RouteInfo[] = [
  { method: 'GET', path: '/api/users', params: [], file: 'pages/api/users.ts', framework: 'nextjs' },
  { method: 'POST', path: '/api/users', params: [], file: 'pages/api/users.ts', framework: 'nextjs' },
];

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-baseline-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('getBaselinePath', () => {
  it('returns path with default name', () => {
    const p = getBaselinePath(tmpDir);
    expect(p).toContain('baseline.default.json');
  });

  it('returns path with custom name', () => {
    const p = getBaselinePath(tmpDir, 'v2');
    expect(p).toContain('baseline.v2.json');
  });
});

describe('saveBaseline and loadBaseline', () => {
  it('saves and loads baseline correctly', () => {
    const filePath = getBaselinePath(tmpDir);
    saveBaseline(sampleRoutes, filePath, 'abc123');
    const data = loadBaseline(filePath);
    expect(data).not.toBeNull();
    expect(data!.routes).toHaveLength(2);
    expect(data!.commit).toBe('abc123');
    expect(data!.createdAt).toBeDefined();
  });

  it('creates directory if it does not exist', () => {
    const nested = path.join(tmpDir, 'deep', 'nested');
    const filePath = getBaselinePath(nested);
    saveBaseline(sampleRoutes, filePath);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('returns null when file does not exist', () => {
    const filePath = getBaselinePath(tmpDir, 'missing');
    expect(loadBaseline(filePath)).toBeNull();
  });

  it('returns null when version mismatches', () => {
    const filePath = getBaselinePath(tmpDir);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify({ version: '99', routes: [] }));
    expect(loadBaseline(filePath)).toBeNull();
  });
});

describe('deleteBaseline', () => {
  it('deletes an existing baseline', () => {
    const filePath = getBaselinePath(tmpDir);
    saveBaseline(sampleRoutes, filePath);
    expect(deleteBaseline(filePath)).toBe(true);
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it('returns false when file does not exist', () => {
    const filePath = getBaselinePath(tmpDir, 'ghost');
    expect(deleteBaseline(filePath)).toBe(false);
  });
});

describe('baselineExists', () => {
  it('returns true when baseline file exists', () => {
    const filePath = getBaselinePath(tmpDir);
    saveBaseline(sampleRoutes, filePath);
    expect(baselineExists(filePath)).toBe(true);
  });

  it('returns false when baseline file does not exist', () => {
    const filePath = getBaselinePath(tmpDir, 'nope');
    expect(baselineExists(filePath)).toBe(false);
  });
});
