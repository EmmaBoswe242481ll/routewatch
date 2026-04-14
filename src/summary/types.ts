export interface RouteSummary {
  totalRoutes: number;
  addedRoutes: number;
  removedRoutes: number;
  modifiedRoutes: number;
  unchangedRoutes: number;
  breakingChanges: number;
  byMethod: Record<string, number>;
  byFramework: Record<string, number>;
}

export interface SummaryOptions {
  includeUnchanged?: boolean;
  groupByMethod?: boolean;
  groupByFramework?: boolean;
}

export interface SummaryResult {
  summary: RouteSummary;
  fromRef: string;
  toRef: string;
  generatedAt: string;
}
