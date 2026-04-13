import type { Parser, ParseResult, RouteDefinition, HttpMethod } from './types';

const NEXTJS_METHOD_REGEX = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s*\(/gm;
const DYNAMIC_SEGMENT_REGEX = /\[([^\]]+)\]/g;

function extractParams(routePath: string): string[] {
  const params: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = DYNAMIC_SEGMENT_REGEX.exec(routePath)) !== null) {
    params.push(match[1].replace(/^\.\.\./, ''));
  }
  return params;
}

function filePathToRoute(filePath: string): string {
  returnn    .replace(/.*\/app/, '')
    .replace(/\/route\.(ts|tsx|js|jsx)$/, '')
    .replace(/\/page\.(ts|tsx|js|jsx)$/, '')
    || '/';
}

export const nextjsParser: Parser = {
  canParse(filePath: string): boolean {
    return /\/app\/.*route\.(ts|tsx|js|jsx)$/.test(filePath);
  },

  parse(filePath: string, content: string): ParseResult {
    const routes: RouteDefinition[] = [];
    const routePath = filePathToRoute(filePath);
    const isDynamic = DYNAMIC_SEGMENT_REGEX.test(routePath);
    const params = extractParams(routePath);

    let match: RegExpExecArray | null;
    const methodRegex = new RegExp(NEXTJS_METHOD_REGEX.source, 'gm');
    while ((match = methodRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      routes.push({
        method: match[1] as HttpMethod,
        path: routePath,
        filePath,
        line: lineNumber,
        isDynamic,
        params,
      });
    }

    return { framework: 'nextjs', routes, errors: [] };
  },
};
