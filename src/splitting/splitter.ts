import { RouteChange } from '../diff/types';

export interface SplitConfig {
  maxChunkSize: number;
  splitBy?: 'method' | 'prefix' | 'changeType';
}

export interface SplitResult {
  chunks: RouteChange[][];
  totalChunks: number;
  totalChanges: number;
  config: SplitConfig;
}

const defaultConfig: SplitConfig = {
  maxChunkSize: 10,
  splitBy: 'changeType',
};

export function splitChanges(
  changes: RouteChange[],
  config: Partial<SplitConfig> = {}
): SplitResult {
  const cfg = { ...defaultConfig, ...config };

  let groups: RouteChange[][];

  if (cfg.splitBy === 'method') {
    const map = new Map<string, RouteChange[]>();
    for (const c of changes) {
      const key = c.method ?? 'UNKNOWN';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    groups = Array.from(map.values());
  } else if (cfg.splitBy === 'prefix') {
    const map = new Map<string, RouteChange[]>();
    for (const c of changes) {
      const prefix = '/' + (c.path.split('/')[1] ?? '');
      if (!map.has(prefix)) map.set(prefix, []);
      map.get(prefix)!.push(c);
    }
    groups = Array.from(map.values());
  } else {
    const map = new Map<string, RouteChange[]>();
    for (const c of changes) {
      const key = c.type;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    groups = Array.from(map.values());
  }

  const chunks: RouteChange[][] = [];
  for (const group of groups) {
    for (let i = 0; i < group.length; i += cfg.maxChunkSize) {
      chunks.push(group.slice(i, i + cfg.maxChunkSize));
    }
  }

  return {
    chunks,
    totalChunks: chunks.length,
    totalChanges: changes.length,
    config: cfg,
  };
}

export function formatSplitText(result: SplitResult): string {
  const lines: string[] = [
    `Split: ${result.totalChanges} changes into ${result.totalChunks} chunks (by ${result.config.splitBy}, max ${result.config.maxChunkSize}/chunk)`,
  ];
  result.chunks.forEach((chunk, i) => {
    lines.push(`  Chunk ${i + 1}: ${chunk.length} change(s)`);
  });
  return lines.join('\n');
}
