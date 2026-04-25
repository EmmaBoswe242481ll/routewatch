import { parseVersion, buildVersionResult } from '../types';

describe('parseVersion', () => {
  it('parses a standard semver string', () => {
    expect(parseVersion('1.2.3')).toEqual([1, 2, 3]);
  });

  it('strips leading v prefix', () => {
    expect(parseVersion('v2.0.1')).toEqual([2, 0, 1]);
  });

  it('throws on invalid version', () => {
    expect(() => parseVersion('not-a-version')).toThrow();
  });

  it('throws when parts are not numbers', () => {
    expect(() => parseVersion('1.x.3')).toThrow();
  });
});

describe('buildVersionResult', () => {
  it('builds a major bump result', () => {
    const result = buildVersionResult('1.2.3', 'major', ['breaking change']);
    expect(result.next).toBe('2.0.0');
    expect(result.bump).toBe('major');
    expect(result.reasons).toContain('breaking change');
  });

  it('builds a minor bump result', () => {
    const result = buildVersionResult('1.2.3', 'minor', []);
    expect(result.next).toBe('1.3.0');
  });

  it('builds a patch bump result', () => {
    const result = buildVersionResult('1.2.3', 'patch', []);
    expect(result.next).toBe('1.2.4');
  });

  it('returns same version for none bump', () => {
    const result = buildVersionResult('1.2.3', 'none', []);
    expect(result.next).toBe('1.2.3');
    expect(result.previous).toBe('1.2.3');
  });
});
