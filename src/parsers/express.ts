import type { Parser, ParseResult, RouteDefinition, HttpMethod } from './types';

const EXPRESS_ROUTE_REGEX =
  /(?:router|app)\.(get|post|put|patch|delete|head|options|all)\s*\(\s*['"\`]([^'"\`]+)['"\`]/gi;

const PARAM_SEGMENT_REGEX = /:([\w]+)/g;

function extractParams(routePath: string): string[] {
  const params: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = PARAM_SEGMENT_REGEX.exec(routePath)) !== null) {
    params.push(match[1]);
  }
  return params;
}

export const expressParser: Parser = {
  canParse(_filePath: string, content: string): boolean {
    return /require\(['"]express['"]\)|from\s+['"]express['"]/.test(content);
  },

  parse(filePath: string, content: string): ParseResult {
    const routes: RouteDefinition[] = [];
    const lines = content.split('\n');

    let match: RegExpExecArray | null;
    const routeRegex = new RegExp(EXPRESS_ROUTE_REGEX.source, 'gi');
    while ((match = routeRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const method = match[1].toUpperCase() as HttpMethod | 'ALL';
      const routePath = match[2];
      const params = extractParams(routePath);

      routes.push({
        method,
        path: routePath,
        filePath,
        line: lineNumber,
        isDynamic: params.length > 0 || routePath.includes('*'),
        params,
      });
    }

    return { framework: 'express', routes, errors: [] };
  },
};
