import * as path from 'path';
import * as fs from 'fs';
import { Plugin } from './types';
import { getRegistry } from './registry';

export interface PluginLoadResult {
  loaded: string[];
  failed: Array<{ name: string; error: string }>;
}

export function resolvePluginPath(nameOrPath: string, cwd: string = process.cwd()): string {
  if (nameOrPath.startsWith('.') || path.isAbsolute(nameOrPath)) {
    return path.resolve(cwd, nameOrPath);
  }
  // Try local node_modules first, then global
  const local = path.join(cwd, 'node_modules', nameOrPath);
  if (fs.existsSync(local)) {
    return local;
  }
  return nameOrPath;
}

export function loadPlugin(nameOrPath: string, cwd?: string): Plugin {
  const resolved = resolvePluginPath(nameOrPath, cwd);
  let mod: unknown;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    mod = require(resolved);
  } catch (err) {
    throw new Error(`Failed to require plugin "${nameOrPath}": ${(err as Error).message}`);
  }
  const plugin: Plugin = (mod as { default?: Plugin }).default ?? (mod as Plugin);
  if (!plugin || typeof plugin.name !== 'string' || typeof plugin.apply !== 'function') {
    throw new Error(`Plugin "${nameOrPath}" does not export a valid Plugin object`);
  }
  return plugin;
}

export function loadPlugins(names: string[], cwd?: string): PluginLoadResult {
  const registry = getRegistry();
  const result: PluginLoadResult = { loaded: [], failed: [] };

  for (const name of names) {
    try {
      const plugin = loadPlugin(name, cwd);
      registry.register(plugin);
      result.loaded.push(plugin.name);
    } catch (err) {
      result.failed.push({ name, error: (err as Error).message });
    }
  }

  return result;
}
