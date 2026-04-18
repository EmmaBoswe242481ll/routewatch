export interface Annotation {
  key: string;
  value: string;
}

export interface AnnotationRule {
  /** Glob-style pattern matched against route path */
  pattern: string;
  annotations: Annotation[];
}

export interface AnnotationOptions {
  rules: AnnotationRule[];
}

/**
 * Returns all annotations from the first rule whose pattern matches the given route path.
 * Returns an empty array if no rule matches.
 */
export function matchAnnotations(path: string, options: AnnotationOptions): Annotation[] {
  for (const rule of options.rules) {
    if (globMatch(rule.pattern, path)) {
      return rule.annotations;
    }
  }
  return [];
}

/** Minimal glob matcher supporting '*' wildcards. */
function globMatch(pattern: string, path: string): boolean {
  const regex = new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
  return regex.test(path);
}
