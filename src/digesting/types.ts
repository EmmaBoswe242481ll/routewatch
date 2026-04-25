export interface DigestConfig {
  algorithm: 'md5' | 'sha1' | 'sha256' | 'sha512';
  fields?: Array<'path' | 'method' | 'type' | 'params'>;
  prefix?: string;
}

export interface DigestedChange {
  original: import('../diff/types').RouteChange;
  digest: string;
  algorithm: string;
  fields: string[];
}

export interface DigestSummary {
  total: number;
  algorithm: string;
  fields: string[];
  unique: number;
  collisions: number;
}

export function buildDigestSummary(digested: DigestedChange[]): DigestSummary {
  const digests = digested.map((d) => d.digest);
  const unique = new Set(digests).size;
  const collisions = digested.length - unique;
  const first = digested[0];
  return {
    total: digested.length,
    algorithm: first?.algorithm ?? 'sha256',
    fields: first?.fields ?? [],
    unique,
    collisions,
  };
}
