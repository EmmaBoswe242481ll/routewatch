/**
 * Route masking: redact sensitive path segments and query params
 * before they appear in reports or notifications.
 */

export interface MaskRule {
  /** Pattern to match against the segment or param name */
  pattern: string | RegExp;
  /** Replacement string (default: '***') */
  replacement?: string;
}

export interface MaskOptions {
  rules: MaskRule[];
  /** If true, mask query parameter values as well */
  maskQueryValues?: boolean;
}

function toRegExp(pattern: string | RegExp): RegExp {
  return pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i');
}

/**
 * Mask individual path segments that match any rule.
 */
export function maskPathSegments(path: string, rules: MaskRule[]): string {
  const segments = path.split('/');
  const masked = segments.map((seg) => {
    for (const rule of rules) {
      if (toRegExp(rule.pattern).test(seg)) {
        return rule.replacement ?? '***';
      }
    }
    return seg;
  });
  return masked.join('/');
}

/**
 * Mask query parameter names/values that match any rule.
 */
export function maskQueryParams(
  query: Record<string, string>,
  rules: MaskRule[],
  maskValues: boolean
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    let maskedKey = key;
    let maskedValue = value;
    for (const rule of rules) {
      const re = toRegExp(rule.pattern);
      if (re.test(key)) {
        maskedKey = rule.replacement ?? '***';
        if (maskValues) maskedValue = rule.replacement ?? '***';
        break;
      }
    }
    result[maskedKey] = maskedValue;
  }
  return result;
}

/**
 * Apply masking to a full route string (path + optional query string).
 */
export function maskRoute(route: string, options: MaskOptions): string {
  const [pathPart, queryPart] = route.split('?');
  const maskedPath = maskPathSegments(pathPart, options.rules);

  if (!queryPart) return maskedPath;

  const queryObj: Record<string, string> = {};
  for (const pair of queryPart.split('&')) {
    const [k, v = ''] = pair.split('=');
    queryObj[k] = v;
  }
  const maskedQuery = maskQueryParams(queryObj, options.rules, options.maskQueryValues ?? false);
  const queryString = Object.entries(maskedQuery)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return `${maskedPath}?${queryString}`;
}

/**
 * Apply masking to an array of route strings.
 */
export function maskRoutes(routes: string[], options: MaskOptions): string[] {
  return routes.map((r) => maskRoute(r, options));
}
