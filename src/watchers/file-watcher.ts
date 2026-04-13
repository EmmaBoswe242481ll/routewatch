import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

export interface FileChangeEvent {
  filePath: string;
  changeType: 'added' | 'modified' | 'deleted';
  timestamp: Date;
}

export interface WatcherOptions {
  rootDir: string;
  patterns: string[];
  debounceMs?: number;
}

export class FileWatcher extends EventEmitter {
  private watchers: fs.FSWatcher[] = [];
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private options: Required<WatcherOptions>;

  constructor(options: WatcherOptions) {
    super();
    this.options = {
      debounceMs: 300,
      ...options,
    };
  }

  start(filePaths: string[]): void {
    for (const filePath of filePaths) {
      if (!fs.existsSync(filePath)) continue;
      const watcher = fs.watch(filePath, (eventType) => {
        this.handleChange(filePath, eventType);
      });
      this.watchers.push(watcher);
    }
    this.emit('ready', { watchedFiles: filePaths.length });
  }

  private handleChange(filePath: string, eventType: string): void {
    const existing = this.debounceTimers.get(filePath);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.debounceTimers.delete(filePath);
      const exists = fs.existsSync(filePath);
      const changeType = eventType === 'rename' && !exists
        ? 'deleted'
        : eventType === 'rename'
        ? 'added'
        : 'modified';

      const event: FileChangeEvent = {
        filePath: path.resolve(filePath),
        changeType,
        timestamp: new Date(),
      };
      this.emit('change', event);
    }, this.options.debounceMs);

    this.debounceTimers.set(filePath, timer);
  }

  stop(): void {
    for (const watcher of this.watchers) {
      watcher.close();
    }
    this.watchers = [];
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    this.emit('stopped');
  }
}
