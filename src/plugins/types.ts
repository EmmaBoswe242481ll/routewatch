export type PluginHook = 'beforeParse' | 'afterParse' | 'beforeDiff' | 'afterDiff' | 'beforeReport' | 'afterReport';

export interface PluginContext {
  framework: 'nextjs' | 'express' | 'unknown';
  filePath?: string;
  commitRef?: string;
  [key: string]: unknown;
}

export interface RouteWatchPlugin {
  name: string;
  version?: string;
  hooks: Partial<Record<PluginHook, PluginHandler>>;
}

export type PluginHandler = (context: PluginContext, payload: unknown) => Promise<unknown> | unknown;

export interface PluginRegistry {
  plugins: RouteWatchPlugin[];
  register(plugin: RouteWatchPlugin): void;
  unregister(name: string): void;
  invoke(hook: PluginHook, context: PluginContext, payload: unknown): Promise<unknown>;
}
