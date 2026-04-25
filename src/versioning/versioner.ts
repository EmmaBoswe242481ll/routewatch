import { RouteChange } from '../diff/types';
import {
  VersionBump,
  VersionConfig,
  VersionResult,
  VersionRule,
  buildVersionResult,
} from './types';

const DEFAULT_RULES: VersionRule[] = [
  { changeTypes: ['removed'], bump: 'major' },
  { changeTypes: ['modified'], bump: 'minor' },
  { changeTypes: ['added'], bump: 'patch' },
];

const BUMP_PRIORITY: Record<VersionBump, number> = {
  major: 3,
  minor: 2,
  patch: 1,
  none: 0,
};

function higherBump(a: VersionBump, b: VersionBump): VersionBump {
  return BUMP_PRIORITY[a] >= BUMP_PRIORITY[b] ? a : b;
}

export function determineVersionBump(
  changes: RouteChange[],
  rules: VersionRule[] = DEFAULT_RULES
): { bump: VersionBump; reasons: string[] } {
  let bump: VersionBump = 'none';
  const reasons: string[] = [];

  for (const change of changes) {
    for (const rule of rules) {
      if (rule.changeTypes.includes(change.type)) {
        const candidate = higherBump(bump, rule.bump);
        if (BUMP_PRIORITY[candidate] > BUMP_PRIORITY[bump]) {
          bump = candidate;
          reasons.push(
            `${rule.bump} bump: ${change.type} route ${change.route.method} ${change.route.path}`
          );
        }
        break;
      }
    }
  }

  return { bump, reasons };
}

export function versionChanges(
  changes: RouteChange[],
  config: VersionConfig
): VersionResult {
  const rules = config.rules ?? DEFAULT_RULES;
  const { bump, reasons } = determineVersionBump(changes, rules);
  return buildVersionResult(config.current, bump, reasons);
}

export function formatVersionText(result: VersionResult): string {
  if (result.bump === 'none') {
    return `Version unchanged: ${result.previous}`;
  }
  const lines = [
    `Version bump (${result.bump}): ${result.previous} → ${result.next}`,
    ...result.reasons.map((r) => `  - ${r}`),
  ];
  return lines.join('\n');
}
