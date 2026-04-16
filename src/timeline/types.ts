export interface TimelineRouteRef {
  key: string;
  type: 'added' | 'removed' | 'modified';
}

export interface TimelineEntry {
  commitHash: string;
  commitDate: string;
  label: string;
  added: number;
  removed: number;
  modified: number;
  total: number;
  routes: TimelineRouteRef[];
}

export interface Timeline {
  entries: TimelineEntry[];
  totalEntries: number;
  totalChanges: number;
}

export interface TimelineOptions {
  limit?: number;
  since?: string;
  until?: string;
}
