import { determineVersionBump, versionChanges, formatVersionText } from '../versioner';
import { RouteChange } from '../../diff/types';

function makeChange(type: 'added' | 'removed' | 'modified', path = '/api/test'): RouteChange {
  return {
    type,
    route: { method: 'GET', path, params: [] },
  } as RouteChange;
}

describe('determineVersionBump', () => {
  it('returns none for empty changes', () => {
    const { bump } = determineVersionBump([]);
    expect(bump).toBe('none');
  });

  it('returns patch for added routes', () => {
    const { bump, reasons } = determineVersionBump([makeChange('added')]);
    expect(bump).toBe('patch');
    expect(reasons.length).toBeGreaterThan(0);
  });

  it('returns minor for modified routes', () => {
    const { bump } = determineVersionBump([makeChange('modified')]);
    expect(bump).toBe('minor');
  });

  it('returns major for removed routes', () => {
    const { bump } = determineVersionBump([makeChange('removed')]);
    expect(bump).toBe('major');
  });

  it('uses highest bump when multiple change types present', () => {
    const changes = [makeChange('added'), makeChange('removed')];
    const { bump } = determineVersionBump(changes);
    expect(bump).toBe('major');
  });

  it('respects custom rules', () => {
    const rules = [{ changeTypes: ['added'], bump: 'major' as const }];
    const { bump } = determineVersionBump([makeChange('added')], rules);
    expect(bump).toBe('major');
  });
});

describe('versionChanges', () => {
  it('returns unchanged version when no changes', () => {
    const result = versionChanges([], { current: '1.2.3' });
    expect(result.previous).toBe('1.2.3');
    expect(result.next).toBe('1.2.3');
    expect(result.bump).toBe('none');
  });

  it('increments patch version for added route', () => {
    const result = versionChanges([makeChange('added')], { current: '1.2.3' });
    expect(result.next).toBe('1.2.4');
  });

  it('increments minor version and resets patch', () => {
    const result = versionChanges([makeChange('modified')], { current: '1.2.3' });
    expect(result.next).toBe('1.3.0');
  });

  it('increments major version and resets minor and patch', () => {
    const result = versionChanges([makeChange('removed')], { current: '2.4.6' });
    expect(result.next).toBe('3.0.0');
  });
});

describe('formatVersionText', () => {
  it('reports unchanged when bump is none', () => {
    const result = versionChanges([], { current: '1.0.0' });
    expect(formatVersionText(result)).toContain('unchanged');
  });

  it('includes bump type and version arrow', () => {
    const result = versionChanges([makeChange('removed')], { current: '1.0.0' });
    const text = formatVersionText(result);
    expect(text).toContain('major');
    expect(text).toContain('1.0.0 → 2.0.0');
  });
});
