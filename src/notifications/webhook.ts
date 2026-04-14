import https from 'https';
import http from 'http';
import { NotificationPayload } from './types';

export interface WebhookConfig {
  url: string;
  secret?: string;
  timeoutMs?: number;
  headers?: Record<string, string>;
}

export interface WebhookResult {
  success: boolean;
  statusCode?: number;
  error?: string;
}

export function buildWebhookHeaders(
  config: WebhookConfig,
  body: string
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body).toString(),
    'User-Agent': 'routewatch/1.0',
    ...config.headers,
  };
  if (config.secret) {
    headers['X-Routewatch-Secret'] = config.secret;
  }
  return headers;
}

export function sendWebhook(
  config: WebhookConfig,
  payload: NotificationPayload
): Promise<WebhookResult> {
  return new Promise((resolve) => {
    const body = JSON.stringify(payload);
    const headers = buildWebhookHeaders(config, body);
    const url = new URL(config.url);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers,
      timeout: config.timeoutMs ?? 5000,
    };
    const req = lib.request(options, (res) => {
      resolve({ success: (res.statusCode ?? 0) < 400, statusCode: res.statusCode });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Request timed out' });
    });
    req.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
    req.write(body);
    req.end();
  });
}
