import { RouteChange } from '../diff/types';

export interface PinRule {
  pattern: string;
  label?: string;
}

export interface PinnedChange {
  change: RouteChange;
  pinned: true;
  label: string;
}

export interface PinResult {
  pinned: PinnedChange[];
  unpinned: RouteChange[];
}

function toRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`, 'i');
}

export function pinChanges(changes: RouteChange[], rules: PinRule[]): PinResult {
  const pinned: PinnedChange[] = [];
  const unpinned: RouteChange[] = [];

  for (const change of changes) {
    const route = change.route ?? (change as any).path ?? '';
    const matched = rules.find(r => toRegExp(r.pattern).test(route));
    if (matched) {
      pinned.push({ change, pinned: true, label: matched.label ?? matched.pattern });
    } else {
      unpinned.push(change);
    }
  }

  return { pinned, unpinned };
}

export function formatPinText(result: PinResult): string {
  const lines: string[] = [`Pinned: ${result.pinned.length}, Unpinned: ${result.unpinned.length}`];
  for (const p of result.pinned) {
    const route = p.change.route ?? (p.change as any).path ?? 'unknown';
    lines.push(`  [PINNED] ${route} (${p.label})`);
  }
  return lines.join('\n');
}
