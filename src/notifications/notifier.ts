import { RouteDiff } from '../diff/types';
import { NotifierOptions, NotificationPayload, NotificationChannel } from './types';

export function buildPayload(
  diff: RouteDiff,
  fromRef: string,
  toRef: string
): NotificationPayload {
  const { added, removed, modified } = diff;
  const totalChanges = added.length + removed.length + modified.length;

  return {
    summary: `RouteWatch: ${totalChanges} route change(s) detected between ${fromRef} and ${toRef}`,
    fromRef,
    toRef,
    added: added.map((r) => `${r.method} ${r.path}`),
    removed: removed.map((r) => `${r.method} ${r.path}`),
    modified: modified.map((r) => `${r.method} ${r.path}`),
    totalChanges,
    timestamp: new Date().toISOString(),
  };
}

export function formatPayloadAsText(payload: NotificationPayload): string {
  const lines: string[] = [payload.summary, ''];

  if (payload.added.length > 0) {
    lines.push(`Added (${payload.added.length}):`);
    payload.added.forEach((r) => lines.push(`  + ${r}`));
    lines.push('');
  }

  if (payload.removed.length > 0) {
    lines.push(`Removed (${payload.removed.length}):`);
    payload.removed.forEach((r) => lines.push(`  - ${r}`));
    lines.push('');
  }

  if (payload.modified.length > 0) {
    lines.push(`Modified (${payload.modified.length}):`);
    payload.modified.forEach((r) => lines.push(`  ~ ${r}`));
    lines.push('');
  }

  return lines.join('\n').trim();
}

export async function notify(
  diff: RouteDiff,
  fromRef: string,
  toRef: string,
  options: NotifierOptions
): Promise<void> {
  if (!options.channels || options.channels.length === 0) return;

  const payload = buildPayload(diff, fromRef, toRef);

  if (payload.totalChanges === 0 && !options.notifyOnNoChanges) return;

  const tasks = options.channels.map((channel: NotificationChannel) =>
    channel.send(payload)
  );

  await Promise.all(tasks);
}
