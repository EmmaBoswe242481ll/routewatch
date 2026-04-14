import { buildWebhookHeaders, sendWebhook } from '../webhook';
import { NotificationPayload } from '../types';
import * as http from 'http';

const mockPayload: NotificationPayload = {
  repository: 'my-app',
  fromRef: 'abc123',
  toRef: 'def456',
  timestamp: '2024-01-01T00:00:00.000Z',
  summary: { added: 1, removed: 0, modified: 0, total: 1 },
  changes: [],
};

describe('buildWebhookHeaders', () => {
  it('includes required headers', () => {
    const headers = buildWebhookHeaders({ url: 'http://example.com' }, '{"a":1}');
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['User-Agent']).toBe('routewatch/1.0');
    expect(headers['Content-Length']).toBe('7');
  });

  it('includes secret header when provided', () => {
    const headers = buildWebhookHeaders({ url: 'http://example.com', secret: 'mysecret' }, '{}');
    expect(headers['X-Routewatch-Secret']).toBe('mysecret');
  });

  it('merges custom headers', () => {
    const headers = buildWebhookHeaders(
      { url: 'http://example.com', headers: { 'X-Custom': 'value' } },
      '{}'
    );
    expect(headers['X-Custom']).toBe('value');
  });

  it('does not include secret header when not provided', () => {
    const headers = buildWebhookHeaders({ url: 'http://example.com' }, '{}');
    expect(headers['X-Routewatch-Secret']).toBeUndefined();
  });
});

describe('sendWebhook', () => {
  let server: http.Server;
  let port: number;

  beforeAll((done) => {
    server = http.createServer((_req, res) => {
      res.writeHead(200);
      res.end();
    });
    server.listen(0, () => {
      port = (server.address() as { port: number }).port;
      done();
    });
  });

  afterAll((done) => server.close(done));

  it('returns success on 200 response', async () => {
    const result = await sendWebhook({ url: `http://localhost:${port}/hook` }, mockPayload);
    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
  });

  it('returns failure on connection refused', async () => {
    const result = await sendWebhook({ url: 'http://localhost:1/hook' }, mockPayload);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
