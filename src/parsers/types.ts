export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface RouteDefinition {
  method: HttpMethod | 'ALL' | 'UNKNOWN';
  path: string;
  filePath: string;
  line?: number;
  isDynamic: boolean;
  params string[];
}

export interface ParseResult {
  framework: 'nextjs' | 'express';
  routes: RouteDefinition[];
  errors: ParseError[];
}

export interface ParseError {
  filePath: string;
  message: string;
  line?: number;
}

export interface Parser {
  canParse(filePath: string, content: string): boolean;
  parse(filePath: string, content: string): ParseResult;
}
