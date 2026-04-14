import { buildPayload, formatPayloadAsText, notify } from '../notifier';
import { RouteDiff } from '../../diff/types';
import { NotificationChannel, NotificationPayload } from '../types';

const mockDiff: RouteDiff = {
  added: [{ method: 'GET', path: '/api/users', params: [], framework: 'nextjs' }],
  removed: [{ method: 'DELETE', path: '/api/legacy', params: [], framework: 'express' }],
  modified: [],
};

describe('buildPayload', () => {
  it('builds a payload with correct counts', () => {
    const payload = buildPayload(mockDiff, 'abc123', 'def456');
    expect(payload.totalChanges).toBe(2);
    expect(payload.added).toEqual(['GET /api/users']);
    expect(payload.removed).toEqual(['DELETE /api/legacy']);
    expect(payload.modified).toHaveLength(0);
    expect(payload.fromRef).toBe('abc123');
    expect(payload.toRef).toBe('def456');
    expect(payload.timestamp).toBeTruthy();
  });

  it('includes summary with ref names', () => {
    const payload = buildPayload(mockDiff, 'main', 'feature-x');
    expect(payload.summary).toContain('main');
    expect(payload.summary).toContain('feature-x');
    expect(payload.summary).toContain('2');
  });
});

describe('formatPayloadAsText', () => {
  it('formats payload into readable text', () => {
    const payload = buildPayload(mockDiff, 'abc', 'def');
    const text = formatPayloadAsText(payload);
    expect(text).toContain('+ GET /api/users');
    expect(text).toContain('- DELETE /api/legacy');
    expect(text).not.toContain('Modified');
  });
});

describe('notify', () => {
  it('calls send on each channel', async () => {
    const sent: NotificationPayload[] = [];
    const channel: NotificationChannel = {
      name: 'mock',
      send: async (p) => { sent.push(p); },
    };
    await notify(mockDiff, 'a', 'b', { channels: [channel] });
    expect(sent).toHaveLength(1);
    expect(sent[0].totalChanges).toBe(2);
  });

  it('skips sending when no changes and notifyOnNoChanges is false', async () => {
    const sent: NotificationPayload[] = [];
    const channel: NotificationChannel = {
      name: 'mock',
      send: async (p) => { sent.push(p); },
    };
    const emptyDiff: RouteDiff = { added: [], removed: [], modified: [] };
    await notify(emptyDiff, 'a', 'b', { channels: [channel], notifyOnNoChanges: false });
    expect(sent).toHaveLength(0);
  });

  it('does nothing when no channels are provided', async () => {
    await expect(notify(mockDiff, 'a', 'b', { channels: [] })).resolves.toBeUndefined();
  });
});
