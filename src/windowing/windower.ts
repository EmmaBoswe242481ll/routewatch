import { RouteChange } from '../diff/types';

export interface WindowConfig {
  size: number;
  step?: number;
}

export interface Window<T> {
  index: number;
  start: number;
  end: number;
  items: T[];
}

export function windowChanges<T>(
  items: T[],
  config: WindowConfig
): Window<T>[] {
  const { size, step = size } = config;
  if (size <= 0 || step <= 0) throw new Error('size and step must be positive');

  const windows: Window<T>[] = [];
  let index = 0;

  for (let start = 0; start < items.length; start += step) {
    const end = Math.min(start + size, items.length);
    windows.push({ index: index++, start, end, items: items.slice(start, end) });
    if (end >= items.length) break;
  }

  return windows;
}

export function windowRouteChanges(
  changes: RouteChange[],
  config: WindowConfig
): Window<RouteChange>[] {
  return windowChanges(changes, config);
}

export function formatWindowText<T>(windows: Window<T>[]): string {
  if (windows.length === 0) return 'No windows.';
  const lines = windows.map(
    (w) => `Window ${w.index}: items ${w.start}–${w.end - 1} (${w.items.length} items)`
  );
  return [`Windows: ${windows.length}`, ...lines].join('\n');
}
