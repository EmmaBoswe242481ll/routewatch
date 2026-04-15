export type ScheduleFrequency = 'hourly' | 'daily' | 'weekly' | 'custom';

export interface ScheduleOptions {
  frequency: ScheduleFrequency;
  /** Cron expression, required when frequency is 'custom' */
  cron?: string;
  /** Directory to store scheduled run results */
  outputDir?: string;
  /** Whether to send webhook notification after each run */
  notify?: boolean;
  /** Refs to compare on each scheduled run */
  fromRef?: string;
  toRef?: string;
}

export interface ScheduledRun {
  id: string;
  scheduledAt: string;
  startedAt: string;
  finishedAt: string;
  success: boolean;
  error?: string;
  outputPath?: string;
}

export interface ScheduleState {
  options: ScheduleOptions;
  lastRun?: ScheduledRun;
  runs: ScheduledRun[];
}
