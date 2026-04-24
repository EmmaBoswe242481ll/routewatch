export interface TemplateVariable {
  name: string;
  value: string;
}

export interface TemplateRule {
  pattern: string;
  template: string;
  variables?: Record<string, string>;
}

export interface TemplateConfig {
  rules: TemplateRule[];
  fallback?: string;
}

export interface TemplatedChange {
  path: string;
  method: string;
  type: string;
  rendered: string;
  rule?: string;
}

export interface TemplateResult {
  changes: TemplatedChange[];
  matched: number;
  unmatched: number;
}

export function buildTemplateResult(changes: TemplatedChange[]): TemplateResult {
  const matched = changes.filter((c) => c.rule !== undefined).length;
  return { changes, matched, unmatched: changes.length - matched };
}
