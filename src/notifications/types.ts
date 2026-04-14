export interface NotificationPayload {
  summary: string;
  fromRef: string;
  toRef: string;
  added: string[];
  removed: string[];
  modified: string[];
  totalChanges: number;
  timestamp: string;
}

export interface NotificationChannel {
  name: string;
  send(payload: NotificationPayload): Promise<void>;
}

export interface NotifierOptions {
  channels: NotificationChannel[];
  notifyOnNoChanges?: boolean;
}
