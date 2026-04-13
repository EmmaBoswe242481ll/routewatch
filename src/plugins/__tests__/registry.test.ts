import { createRegistry, getRegistry, resetRegistry } from '../registry';
import type { RouteWatchPlugin } from '../types';

const makePlugin = (name: string, hookFn?: jest.Mock): RouteWatchPlugin => ({
  name,
  version: '1.0.0',
  hooks: {
    afterParse: hookFn,
  },
});

describe('PluginRegistry', () => {
  let registry: ReturnType<typeof createRegistry>;

  beforeEach(() => {
    registry = createRegistry();
  });

  it('registers a plugin', () => {
    const plugin = makePlugin('test-plugin');
    registry.register(plugin);
    expect(registry.plugins).toHaveLength(1);
    expect(registry.plugins[0].name).toBe('test-plugin');
  });

  it('throws when registering a duplicate plugin', () => {
    const plugin = makePlugin('dup-plugin');
    registry.register(plugin);
    expect(() => registry.register(plugin)).toThrow('already registered');
  });

  it('unregisters a plugin', () => {
    const plugin = makePlugin('removable');
    registry.register(plugin);
    registry.unregister('removable');
    expect(registry.plugins).toHaveLength(0);
  });

  it('throws when unregistering unknown plugin', () => {
    expect(() => registry.unregister('ghost')).toThrow('not registered');
  });

  it('invokes hook on registered plugins in order', async () => {
    const results: string[] = [];
    const pluginA = makePlugin('a', jest.fn((_ctx, payload) => { results.push('a'); return payload; }));
    const pluginB = makePlugin('b', jest.fn((_ctx, payload) => { results.push('b'); return payload; }));
    registry.register(pluginA);
    registry.register(pluginB);
    await registry.invoke('afterParse', { framework: 'nextjs' }, {});
    expect(results).toEqual(['a', 'b']);
  });

  it('passes transformed payload between plugins', async () => {
    const pluginA = makePlugin('a', jest.fn((_ctx, _payload) => ({ modified: true })));
    const pluginB = makePlugin('b', jest.fn((_ctx, payload) => ({ ...(payload as object), second: true })));
    registry.register(pluginA);
    registry.register(pluginB);
    const result = await registry.invoke('afterParse', { framework: 'express' }, {});
    expect(result).toEqual({ modified: true, second: true });
  });

  it('getRegistry returns singleton and resetRegistry clears it', () => {
    resetRegistry();
    const r1 = getRegistry();
    const r2 = getRegistry();
    expect(r1).toBe(r2);
    resetRegistry();
    const r3 = getRegistry();
    expect(r3).not.toBe(r1);
  });
});
