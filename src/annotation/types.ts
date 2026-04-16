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
