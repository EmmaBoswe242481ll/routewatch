import { RouteDiff } from '../diff/types';
import { NotificationPayload } from './types';

export interface NotifierOptions {
  repository: string;
  fromRef: string;
  toRef: string;
}

export function buildPayload(
  diffs: RouteDiff[],
  options: NotifierOptions
): NotificationPayload {
  const added = diffs.filter((d) => d.type === 'added').length;
  const removed = diffs.filter((d) => d.type === 'removed').length;
  const modified = diffs.filter((d) => d.type === 'modified').length;
  return {
    repository: options.repository,
    fromRef: options.fromRef,
    toRef: options.toRef,
    timestamp: new Date().toISOString(),
    summary: { added, removed, modified, total: diffs.length },
    changes: diffs,
  };
}

export function formatPayloadAsText(payload: NotificationPayload): string {
  const lines: string[] = [
    `RouteWatch Report: ${payload.repository}`,
    `Comparing ${payload.fromRef} → ${payload.toRef}`,
    `Timestamp: ${payload.timestamp}`,
    '',
    `Summary: +${payload.summary.added} added, -${payload.summary.removed} removed, ~${payload.summary.modified} modified`,
    '',
  ];
  for (const change of payload.changes) {
    const symbol = change.type === 'added' ? '+' : change.type === 'removed' ? '-' : '~';
    const route = change.after ?? change.before;
    if (route) {
      lines.push(`  ${symbol} [${route.method}] ${route.path}`);
    }
  }
  return lines.join('\n');
}
