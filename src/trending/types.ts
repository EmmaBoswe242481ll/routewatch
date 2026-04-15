export interface TrendEntry {
  routeKey: string;
  method: string;
  path: string;
  changeCount: number;
  firstSeen: string;
  lastSeen: string;
  changeTypes: string[];
}

export interface TrendReport {
  generatedAt: string;
  windowDays: number;
  entries: TrendEntry[];
  mostChanged: TrendEntry | null;
  mostVolatile: TrendEntry | null;
}

export interface TrendOptions {
  windowDays?: number;
  minChangeCount?: number;
  sortBy?: 'changeCount' | 'lastSeen' | 'firstSeen';
  limit?: number;
}
