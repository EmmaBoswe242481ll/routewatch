import * as crypto from 'crypto';
import type { RouteChange } from '../diff/types';
import type { DigestConfig, DigestedChange, DigestSummary } from './types';
import { buildDigestSummary } from './types';

const DEFAULT_FIELDS: Array<'path' | 'method' | 'type' | 'params'> = [
  'path',
  'method',
  'type',
];

function buildInput(change: RouteChange, fields: DigestConfig['fields']): string {
  const parts: string[] = [];
  const active = fields ?? DEFAULT_FIELDS;
  if (active.includes('path')) parts.push(change.route.path);
  if (active.includes('method')) parts.push(change.route.method);
  if (active.includes('type')) parts.push(change.type);
  if (active.includes('params')) {
    const params = change.route.params ?? [];
    parts.push(params.slice().sort().join(','));
  }
  return parts.join('|');
}

export function digestChange(
  change: RouteChange,
  config: DigestConfig
): DigestedChange {
  const fields = config.fields ?? DEFAULT_FIELDS;
  const input = buildInput(change, fields);
  const raw = crypto.createHash(config.algorithm).update(input).digest('hex');
  const digest = config.prefix ? `${config.prefix}${raw}` : raw;
  return { original: change, digest, algorithm: config.algorithm, fields };
}

export function digestChanges(
  changes: RouteChange[],
  config: DigestConfig
): DigestedChange[] {
  return changes.map((c) => digestChange(c, config));
}

export function groupByDigest(
  digested: DigestedChange[]
): Record<string, DigestedChange[]> {
  return digested.reduce<Record<string, DigestedChange[]>>((acc, d) => {
    (acc[d.digest] ??= []).push(d);
    return acc;
  }, {});
}

export function getSummary(digested: DigestedChange[]): DigestSummary {
  return buildDigestSummary(digested);
}

export function formatDigestText(digested: DigestedChange[]): string {
  if (digested.length === 0) return 'No changes digested.';
  const summary = buildDigestSummary(digested);
  const lines: string[] = [
    `Digest Summary (${summary.algorithm}):`,
    `  Fields : ${summary.fields.join(', ')}`,
    `  Total  : ${summary.total}`,
    `  Unique : ${summary.unique}`,
    `  Collisions: ${summary.collisions}`,
    '',
    ...digested.map(
      (d) =>
        `  [${d.original.type.padEnd(7)}] ${d.original.route.method} ${d.original.route.path} => ${d.digest.slice(0, 12)}...`
    ),
  ];
  return lines.join('\n');
}
