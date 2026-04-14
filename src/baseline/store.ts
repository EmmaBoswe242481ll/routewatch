import * as fs from 'fs';
import * as path from 'path';
import { RouteInfo } from '../parsers/types';

export interface BaselineData {
  version: string;
  createdAt: string;
  commit?: string;
  routes: RouteInfo[];
}

const BASELINE_VERSION = '1';

export function getBaselinePath(dir: string, name = 'default'): string {
  return path.join(dir, '.routewatch', `baseline.${name}.json`);
}

export function saveBaseline(
  routes: RouteInfo[],
  filePath: string,
  commit?: string
): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const data: BaselineData = {
    version: BASELINE_VERSION,
    createdAt: new Date().toISOString(),
    commit,
    routes,
  };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function loadBaseline(filePath: string): BaselineData | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw) as BaselineData;
    if (data.version !== BASELINE_VERSION) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function deleteBaseline(filePath: string): boolean {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  fs.unlinkSync(filePath);
  return true;
}

export function baselineExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}
