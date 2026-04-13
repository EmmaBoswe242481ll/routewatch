import fs from 'fs';
import path from 'path';
import { RouteWatchConfig, RouteWatchConfigSchema, DEFAULT_CONFIG } from './schema';

const CONFIG_FILE_NAMES = [
  'routewatch.config.json',
  'routewatch.config.js',
  '.routewatchrc',
  '.routewatchrc.json',
];

export function findConfigFile(cwd: string = process.cwd()): string | null {
  for (const fileName of CONFIG_FILE_NAMES) {
    const filePath = path.resolve(cwd, fileName);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
}

export function loadConfig(configPath?: string, cwd: string = process.cwd()): RouteWatchConfig {
  const resolvedPath = configPath
    ? path.resolve(cwd, configPath)
    : findConfigFile(cwd);

  if (!resolvedPath) {
    return DEFAULT_CONFIG;
  }

  try {
    const raw = fs.readFileSync(resolvedPath, 'utf-8');
    const parsed = JSON.parse(raw);
    const result = RouteWatchConfigSchema.safeParse(parsed);

    if (!result.success) {
      console.warn(`[routewatch] Invalid config at ${resolvedPath}:`, result.error.flatten());
      return DEFAULT_CONFIG;
    }

    return result.data;
  } catch (err) {
    console.warn(`[routewatch] Failed to load config from ${resolvedPath}:`, err);
    return DEFAULT_CONFIG;
  }
}

export function mergeConfig(
  base: RouteWatchConfig,
  overrides: Partial<RouteWatchConfig>
): RouteWatchConfig {
  return RouteWatchConfigSchema.parse({ ...base, ...overrides });
}
