import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { FileWatcher } from '../file-watcher';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-watcher-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('FileWatcher', () => {
  it('emits ready event with watched file count', (done) => {
    const filePath = path.join(tmpDir, 'route.ts');
    fs.writeFileSync(filePath, 'export default {}');

    const watcher = new FileWatcher({ rootDir: tmpDir, patterns: ['**/*.ts'] });
    watcher.on('ready', ({ watchedFiles }) => {
      expect(watchedFiles).toBe(1);
      watcher.stop();
      done();
    });
    watcher.start([filePath]);
  });

  it('emits change event when a file is modified', (done) => {
    const filePath = path.join(tmpDir, 'api.ts');
    fs.writeFileSync(filePath, 'export default {}');

    const watcher = new FileWatcher({ rootDir: tmpDir, patterns: ['**/*.ts'], debounceMs: 50 });
    watcher.on('ready', () => {
      fs.writeFileSync(filePath, 'export const updated = true');
    });
    watcher.on('change', (event) => {
      expect(event.changeType).toBe('modified');
      expect(event.filePath).toBe(path.resolve(filePath));
      expect(event.timestamp).toBeInstanceOf(Date);
      watcher.stop();
      done();
    });
    watcher.start([filePath]);
  });

  it('emits stopped event when stop is called', (done) => {
    const watcher = new FileWatcher({ rootDir: tmpDir, patterns: [] });
    watcher.on('stopped', () => done());
    watcher.start([]);
    watcher.stop();
  });

  it('skips non-existent files silently', () => {
    const watcher = new FileWatcher({ rootDir: tmpDir, patterns: [] });
    expect(() => watcher.start(['/nonexistent/file.ts'])).not.toThrow();
    watcher.stop();
  });
});
