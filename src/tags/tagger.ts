import { RouteInfo } from '../parsers/types';
import { TagConfig, TaggedRoute, TagRule, TagSummary } from './types';

export function matchesTagRule(route: RouteInfo, rule: TagRule): boolean {
  const pattern = new RegExp(rule.pattern);
  if (!pattern.test(route.path)) return false;
  if (rule.methods && rule.methods.length > 0) {
    const method = route.method?.toUpperCase() ?? 'GET';
    return rule.methods.map((m) => m.toUpperCase()).includes(method);
  }
  return true;
}

export function applyTags(routes: RouteInfo[], config: TagConfig): TaggedRoute[] {
  return routes.map((route) => {
    const matched: string[] = [];
    for (const rule of config.rules) {
      if (matchesTagRule(route, rule)) {
        matched.push(...rule.tags);
      }
    }
    return {
      path: route.path,
      method: route.method ?? 'GET',
      tags: [...new Set(matched)],
      file: route.file,
    };
  });
}

export function groupByTag(tagged: TaggedRoute[]): TagSummary[] {
  const map = new Map<string, TaggedRoute[]>();
  for (const route of tagged) {
    for (const tag of route.tags) {
      if (!map.has(tag)) map.set(tag, []);
      map.get(tag)!.push(route);
    }
  }
  return Array.from(map.entries()).map(([tag, routes]) => ({
    tag,
    count: routes.length,
    routes,
  }));
}

export function resolveTagMeta(
  tagName: string,
  config: TagConfig
): { name: string; color?: string; description?: string } {
  return config.tags[tagName] ?? { name: tagName };
}
