import type { ParsedRoute } from '../parsers/types';
import type { FilterSet, FilterResult, RouteFilter, MethodFilter } from './types';

function matchesPattern(value: string, pattern: string | RegExp): boolean {
  if (pattern instanceof RegExp) {
    return pattern.test(value);
  }
  // Support simple glob-style wildcards
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(value);
}

function applyRouteFilters(route: ParsedRoute, filters: RouteFilter[]): boolean {
  for (const filter of filters) {
    const matched = matchesPattern(route.path, filter.pattern);
    if (filter.operator === 'include' && !matched) return false;
    if (filter.operator === 'exclude' && matched) return false;
  }
  return true;
}

function applyMethodFilters(route: ParsedRoute, filters: MethodFilter[]): boolean {
  for (const filter of filters) {
    const routeMethods = route.methods.map(m => m.toUpperCase());
    const filterMethods = filter.methods.map(m => m.toUpperCase());
    const hasMatch = routeMethods.some(m => filterMethods.includes(m));
    if (filter.operator === 'include' && !hasMatch) return false;
    if (filter.operator === 'exclude' && hasMatch) return false;
  }
  return true;
}

export function filterRoutes(
  routes: ParsedRoute[],
  filterSet: FilterSet
): FilterResult<ParsedRoute> {
  const matched: ParsedRoute[] = [];
  const excluded: ParsedRoute[] = [];

  for (const route of routes) {
    let passes = true;

    if (filterSet.routes && filterSet.routes.length > 0) {
      passes = passes && applyRouteFilters(route, filterSet.routes);
    }

    if (filterSet.methods && filterSet.methods.length > 0) {
      passes = passes && applyMethodFilters(route, filterSet.methods);
    }

    if (passes) {
      matched.push(route);
    } else {
      excluded.push(route);
    }
  }

  return { matched, excluded };
}
