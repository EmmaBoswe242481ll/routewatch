export type ExportFormat = 'json' | 'markdown' | 'csv' | 'html';

export interface ExportOptions {
  format: ExportFormat;
  outputPath?: string;
  includeMetadata?: boolean;
  pretty?: boolean;
}

export interface ExportResult {
  format: ExportFormat;
  content: string;
  outputPath?: string;
  writtenAt?: Date;
  byteSize: number;
}

export interface ExportMetadata {
  generatedAt: string;
  toolVersion: string;
  fromRef: string;
  toRef: string;
  totalRoutes: number;
  totalChanges: number;
}
