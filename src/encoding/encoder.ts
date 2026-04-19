import type { RouteChange } from '../diff/types';

export type EncodingFormat = 'base64' | 'uri' | 'hex';

export interface EncodeOptions {
  format: EncodingFormat;
  fields?: Array<'path' | 'method'>;
}

export interface EncodedChange {
  original: RouteChange;
  encoded: Partial<Record<'path' | 'method', string>>;
}

export function encodeValue(value: string, format: EncodingFormat): string {
  switch (format) {
    case 'base64':
      return Buffer.from(value).toString('base64');
    case 'uri':
      return encodeURIComponent(value);
    case 'hex':
      return Buffer.from(value).toString('hex');
    default:
      return value;
  }
}

export function encodeChange(change: RouteChange, options: EncodeOptions): EncodedChange {
  const fields = options.fields ?? ['path'];
  const encoded: Partial<Record<'path' | 'method', string>> = {};

  if (fields.includes('path') && change.path) {
    encoded.path = encodeValue(change.path, options.format);
  }
  if (fields.includes('method') && change.method) {
    encoded.method = encodeValue(change.method, options.format);
  }

  return { original: change, encoded };
}

export function encodeChanges(changes: RouteChange[], options: EncodeOptions): EncodedChange[] {
  return changes.map(c => encodeChange(c, options));
}

export function formatEncodingText(results: EncodedChange[]): string {
  if (results.length === 0) return 'No changes encoded.';
  const lines = results.map(r => {
    const parts = Object.entries(r.encoded)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    return `  [${r.original.type}] ${r.original.path} => ${parts}`;
  });
  return `Encoded ${results.length} change(s):\n${lines.join('\n')}`;
}
