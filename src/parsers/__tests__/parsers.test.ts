import { nextjsParser } from '../nextjs';
import { expressParser } from '../express';
import { parseFile } from '../index';

const NEXTJS_ROUTE_CONTENT = `
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ created: true });
}
`;

const EXPRESS_APP_CONTENT = `
const express = require('express');
const router = express.Router();

router.get('/users', (req, res) => res.json([]));
router.post('/users', (req, res) => res.json({}));
router.get('/users/:id', (req, res) => res.json({}));
router.delete('/users/:id', (req, res) => res.sendStatus(204));
`;

describe('nextjsParser', () => {
  const filePath = 'src/app/api/users/route.ts';

  it('canParse returns true for app router route files', () => {
    expect(nextjsParser.canParse(filePath, '')).toBe(true);
  });

  it('canParse returns false for non-route files', () => {
    expect(nextjsParser.canParse('src/app/page.tsx', '')).toBe(false);
  });

  it('parses GET and POST methods', () => {
    const result = nextjsParser.parse(filePath, NEXTJS_ROUTE_CONTENT);
    expect(result.framework).toBe('nextjs');
    expect(result.routes).toHaveLength(2);
    expect(result.routes.map(r => r.method)).toEqual(expect.arrayContaining(['GET', 'POST']));
  });

  it('extracts dynamic params from file path', () => {
    const dynamicPath = 'src/app/api/users/[id]/route.ts';
    const result = nextjsParser.parse(dynamicPath, NEXTJS_ROUTE_CONTENT);
    expect(result.routes[0].isDynamic).toBe(true);
    expect(result.routes[0].params).toContain('id');
  });
});

describe('expressParser', () => {
  const filePath = 'src/routes/users.ts';

  it('canParse returns true when express is imported', () => {
    expect(expressParser.canParse(filePath, EXPRESS_APP_CONTENT)).toBe(true);
  });

  it('parses all route methods', () => {
    const result = expressParser.parse(filePath, EXPRESS_APP_CONTENT);
    expect(result.framework).toBe('express');
    expect(result.routes).toHaveLength(4);
  });

  it('marks routes with params as dynamic', () => {
    const result = expressParser.parse(filePath, EXPRESS_APP_CONTENT);
    const dynamicRoutes = result.routes.filter(r => r.isDynamic);
    expect(dynamicRoutes).toHaveLength(2);
    expect(dynamicRoutes[0].params).toContain('id');
  });
});

describe('parseFile', () => {
  it('returns null for unrecognised files', () => {
    expect(parseFile('src/utils/helper.ts', 'export const x = 1;')).toBeNull();
  });

  it('delegates to nextjs parser for app route files', () => {
    const result = parseFile('src/app/api/health/route.ts', NEXTJS_ROUTE_CONTENT);
    expect(result?.framework).toBe('nextjs');
  });
});
