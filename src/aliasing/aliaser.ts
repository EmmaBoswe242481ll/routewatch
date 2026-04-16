export interface AliasRule {
  pattern: string;
  alias: string;
}

export interface AliasOptions {
  rules: AliasRule[];
}

export interface AliasedRoute {
  original: string;
  alias: string | null;
}

function toRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

export function resolveAlias(path: string, rules: AliasRule[]): string | null {
  for (const rule of rules) {
    if (toRegExp(rule.pattern).test(path)) {
      return rule.alias;
    }
  }
  return null;
}

export function aliasRoute(path: string, options: AliasOptions): AliasedRoute {
  return {
    original: path,
    alias: resolveAlias(path, options.rules),
  };
}

export function aliasRoutes(paths: string[], options: AliasOptions): AliasedRoute[] {
  return paths.map((p) => aliasRoute(p, options));
}

export function formatAliasText(aliased: AliasedRoute[]): string {
  const lines = aliased
    .filter((a) => a.alias !== null)
    .map((a) => `  ${a.original} → ${a.alias}`);
  if (lines.length === 0) return 'No aliases resolved.';
  return `Resolved aliases (${lines.length}):\n${lines.join('\n')}`;
}
