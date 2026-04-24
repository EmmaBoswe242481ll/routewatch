import type { RouteChange } from '../diff/types';
import type { TemplateConfig, TemplatedChange, TemplateResult } from './types';
import { buildTemplateResult } from './types';

function toRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

export function templateChange(
  change: RouteChange,
  config: TemplateConfig
): TemplatedChange {
  const vars: Record<string, string> = {
    path: change.path,
    method: change.method,
    type: change.type,
    ...(change.type === 'modified' && change.before ? { before: change.before.path } : {}),
  };

  for (const rule of config.rules) {
    const re = toRegExp(rule.pattern);
    if (re.test(change.path)) {
      const merged = { ...vars, ...rule.variables };
      return {
        path: change.path,
        method: change.method,
        type: change.type,
        rendered: interpolate(rule.template, merged),
        rule: rule.pattern,
      };
    }
  }

  const fallbackTemplate = config.fallback ?? '[{{method}}] {{path}} ({{type}})';
  return {
    path: change.path,
    method: change.method,
    type: change.type,
    rendered: interpolate(fallbackTemplate, vars),
  };
}

export function templateChanges(
  changes: RouteChange[],
  config: TemplateConfig
): TemplateResult {
  const templated = changes.map((c) => templateChange(c, config));
  return buildTemplateResult(templated);
}

export function formatTemplateText(result: TemplateResult): string {
  const lines: string[] = [
    `Templated ${result.changes.length} change(s): ${result.matched} matched, ${result.unmatched} unmatched.`,
  ];
  for (const c of result.changes) {
    lines.push(`  ${c.rendered}`);
  }
  return lines.join('\n');
}
