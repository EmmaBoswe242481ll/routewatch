import { RouteChange } from '../diff/types';

export interface CompressionOptions {
  omitUnchanged?: boolean;
  omitMeta?: boolean;
  compactParams?: boolean;
}

export interface CompressedChange {
  k: string; // key: method:path
  t: string; // type
  p?: string[]; // added params
  r?: string[]; // removed params
  m?: string;  // message
}

export interface CompressionResult {
  changes: CompressedChange[];
  originalCount: number;
  compressedCount: number;
  bytesSaved: number;
}

export function compressChange(change: RouteChange, opts: CompressionOptions = {}): CompressedChange {
  const compressed: CompressedChange = {
    k: `${change.method}:${change.path}`,
    t: change.type,
  };

  if (!opts.compactParams) {
    if (change.paramChanges?.added?.length) compressed.p = change.paramChanges.added;
    if (change.paramChanges?.removed?.length) compressed.r = change.paramChanges.removed;
  }

  if (!opts.omitMeta && change.description) {
    compressed.m = change.description;
  }

  return compressed;
}

export function compressChanges(changes: RouteChange[], opts: CompressionOptions = {}): CompressionResult {
  const filtered = opts.omitUnchanged
    ? changes.filter(c => c.type !== 'unchanged')
    : changes;

  const compressed = filtered.map(c => compressChange(c, opts));

  const originalSize = JSON.stringify(changes).length;
  const compressedSize = JSON.stringify(compressed).length;

  return {
    changes: compressed,
    originalCount: changes.length,
    compressedCount: compressed.length,
    bytesSaved: Math.max(0, originalSize - compressedSize),
  };
}

export function formatCompressionText(result: CompressionResult): string {
  const lines: string[] = [
    `Compression: ${result.originalCount} → ${result.compressedCount} changes`,
    `Bytes saved: ${result.bytesSaved}`,
  ];
  return lines.join('\n');
}
