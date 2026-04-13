import { nextjsParser } from './nextjs';
import { expressParser } from './express';
import type { Parser, ParseResult } from './types';

export { nextjsParser } from './nextjs';
export { expressParser } from './express';
export type { RouteDefinition, ParseResult, ParseError, HttpMethod, Parser } from './types';

const parsers: Parser[] = [nextjsParser, expressParser];

export function parseFile(filePath: string, content: string): ParseResult | null {
  for (const parser of parsers) {
    if (parser.canParse(filePath, content)) {
      return parser.parse(filePath, content);
    }
  }
  return null;
}

export function parseFiles(
  files: Array<{ path: string; content: string }>
): ParseResult[] {
  const results: ParseResult[] = [];
  for (const file of files) {
    const result = parseFile(file.path, file.content);
    if (result) {
      results.push(result);
    }
  }
  return results;
}
