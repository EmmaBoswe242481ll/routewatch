import type { PluginContext, PluginHook, PluginRegistry, RouteWatchPlugin } from './types';

let instance: PluginRegistry | null = null;

export function createRegistry(): PluginRegistry {
  const plugins: RouteWatchPlugin[] = [];

  const registry: PluginRegistry = {
    plugins,

    register(plugin: RouteWatchPlugin): void {
      const exists = plugins.find((p) => p.name === plugin.name);
      if (exists) {
        throw new Error(`Plugin "${plugin.name}" is already registered.`);
      }
      plugins.push(plugin);
    },

    unregister(name: string): void {
      const idx = plugins.findIndex((p) => p.name === name);
      if (idx === -1) {
        throw new Error(`Plugin "${name}" is not registered.`);
      }
      plugins.splice(idx, 1);
    },

    async invoke(hook: PluginHook, context: PluginContext, payload: unknown): Promise<unknown> {
      let current = payload;
      for (const plugin of plugins) {
        const handler = plugin.hooks[hook];
        if (typeof handler === 'function') {
          const result = await handler(context, current);
          if (result !== undefined) {
            current = result;
          }
        }
      }
      return current;
    },
  };

  return registry;
}

export function getRegistry(): PluginRegistry {
  if (!instance) {
    instance = createRegistry();
  }
  return instance;
}

export function resetRegistry(): void {
  instance = null;
}
