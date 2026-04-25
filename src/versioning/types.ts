export type VersionBump = 'major' | 'minor' | 'patch' | 'none';

export interface VersionRule {
  changeTypes: string[];
  bump: VersionBump;
}

export interface VersionResult {
  previous: string;
  next: string;
  bump: VersionBump;
  reasons: string[];
}

export interface VersionConfig {
  current: string;
  rules?: VersionRule[];
}

export function parseVersion(version: string): [number, number, number] {
  const parts = version.replace(/^v/, '').split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid semver: ${version}`);
  }
  return [parts[0], parts[1], parts[2]];
}

export function buildVersionResult(
  previous: string,
  bump: VersionBump,
  reasons: string[]
): VersionResult {
  const [major, minor, patch] = parseVersion(previous);
  let next: string;
  if (bump === 'major') next = `${major + 1}.0.0`;
  else if (bump === 'minor') next = `${major}.${minor + 1}.0`;
  else if (bump === 'patch') next = `${major}.${minor}.${patch + 1}`;
  else next = previous;
  return { previous, next, bump, reasons };
}
