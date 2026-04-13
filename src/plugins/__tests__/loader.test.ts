import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { loadPlugin, loadPlugins, resolvePluginPath } from '../loader';
import { resetRegistry, getRegistry } from '../registry';

let tmpDir: string;

beforeEach(() => {
  resetRegistry();
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-plugin-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writePlugin(dir: string, filename: string, content: string): string {
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, content);
  return filePath;
}

describe('resolvePluginPath', () => {
  it('resolves absolute paths unchanged', () => {
    const abs = path.join(tmpDir, 'plugin.js');
    expect(resolvePluginPath(abs)).toBe(abs);
  });

  it('resolves relative paths against cwd', () => {
    const result = resolvePluginPath('./myplugin', tmpDir);
    expect(result).toBe(path.join(tmpDir, 'myplugin'));
  });

  it('returns bare name when not found in node_modules', () => {
    expect(resolvePluginPath('some-package', tmpDir)).toBe('some-package');
  });
});

describe('loadPlugin', () => {
  it('loads a valid plugin from a file path', () => {
    const pluginPath = writePlugin(tmpDir, 'valid-plugin.js', [
      'module.exports = { name: "test-plugin", apply: function() {} };'
    ].join('\n'));
    const plugin = loadPlugin(pluginPath);
    expect(plugin.name).toBe('test-plugin');
    expect(typeof plugin.apply).toBe('function');
  });

  it('loads a plugin exported as default', () => {
    const pluginPath = writePlugin(tmpDir, 'default-plugin.js',
      'module.exports = { default: { name: "default-plugin", apply: function() {} } };'
    );
    const plugin = loadPlugin(pluginPath);
    expect(plugin.name).toBe('default-plugin');
  });

  it('throws when plugin is missing name', () => {
    const pluginPath = writePlugin(tmpDir, 'bad-plugin.js',
      'module.exports = { apply: function() {} };'
    );
    expect(() => loadPlugin(pluginPath)).toThrow('valid Plugin object');
  });

  it('throws when require fails', () => {
    expect(() => loadPlugin(path.join(tmpDir, 'nonexistent.js'))).toThrow('Failed to require plugin');
  });
});

describe('loadPlugins', () => {
  it('registers loaded plugins and reports results', () => {
    const p1 = writePlugin(tmpDir, 'p1.js', 'module.exports = { name: "p1", apply: function() {} };');
    const p2 = writePlugin(tmpDir, 'p2.js', 'module.exports = { name: "p2", apply: function() {} };');
    const result = loadPlugins([p1, p2]);
    expect(result.loaded).toEqual(['p1', 'p2']);
    expect(result.failed).toHaveLength(0);
    expect(getRegistry().list()).toHaveLength(2);
  });

  it('records failures without throwing', () => {
    const valid = writePlugin(tmpDir, 'ok.js', 'module.exports = { name: "ok", apply: function() {} };');
    const result = loadPlugins([valid, path.join(tmpDir, 'missing.js')]);
    expect(result.loaded).toEqual(['ok']);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].name).toContain('missing.js');
  });
});
