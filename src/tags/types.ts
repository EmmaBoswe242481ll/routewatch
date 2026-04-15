export interface RouteTag {
  name: string;
  color?: string;
  description?: string;
}

export interface TagRule {
  pattern: string;
  tags: string[];
  methods?: string[];
}

export interface TagConfig {
  rules: TagRule[];
  tags: Record<string, RouteTag>;
}

export interface TaggedRoute {
  path: string;
  method: string;
  tags: string[];
  file?: string;
}

export interface TagSummary {
  tag: string;
  count: number;
  routes: TaggedRoute[];
}
