import { RouteChange } from '../diff/types';

export interface Annotation {
  key: string;
  value: string;
}

export interface AnnotationRule {
  pattern: string;
  annotations: Annotation[];
}

export interface AnnotatedChange extends RouteChange {
  annotations: Annotation[];
}

export interface AnnotationOptions {
  rules: AnnotationRule[];
}

function toRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

export function annotateChange(
  change: RouteChange,
  rules: AnnotationRule[]
): AnnotatedChange {
  const collected: Annotation[] = [];
  for (const rule of rules) {
    const re = toRegExp(rule.pattern);
    if (re.test(change.route)) {
      collected.push(...rule.annotations);
    }
  }
  return { ...change, annotations: collected };
}

export function annotateChanges(
  changes: RouteChange[],
  options: AnnotationOptions
): AnnotatedChange[] {
  return changes.map(c => annotateChange(c, options.rules));
}

export function formatAnnotationText(changes: AnnotatedChange[]): string {
  if (changes.length === 0) return 'No annotated changes.';
  return changes
    .filter(c => c.annotations.length > 0)
    .map(c => {
      const tags = c.annotations.map(a => `${a.key}=${a.value}`).join(', ');
      return `${c.method} ${c.route} [${tags}]`;
    })
    .join('\n') || 'No annotations matched.';
}
