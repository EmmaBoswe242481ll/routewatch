import { RouteDiff } from '../diff/types';

export interface NotificationPayload {
  repository: string;
  fromRef: string;
  toRef: string;
  timestamp: string;
  summary: {
    added: number;
    removed: number;
    modified: number;
    total: number;
  };
  changes: RouteDiff[];
}
