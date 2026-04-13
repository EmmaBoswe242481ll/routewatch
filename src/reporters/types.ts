export type ReportFormat = 'json' | 'markdown' | 'text';

export interface ReportOptions {
  format: ReportFormat;
  outputPath?: string;
  includeUnchanged?: boolean;
  title?: string;
}

export interface ReportSection {
  heading: string;
  items: string[];
}

export interface Report {
  title: string;
  generatedAt: string;
  fromRef: string;
  toRef: string;
  summary: {
    added: number;
    removed: number;
    modified: number;
    total: number;
  };
  sections: ReportSection[];
  raw?: unknown;
}
