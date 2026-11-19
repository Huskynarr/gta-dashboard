// Minimal Sentry reporter for the collector (no npm dependency: the workflow
// runs plain `node`). Sends events via the envelope endpoint of the
// self-hosted instance. Without SENTRY_DSN (local runs) every call is a no-op,
// and reporting never throws or delays the data commit for long.
import { randomUUID } from 'node:crypto';

const DSN = process.env.SENTRY_DSN || '';

function parseDsn(dsn) {
  const match = /^(https?):\/\/([^@]+)@([^/]+)\/(\d+)$/.exec(dsn.trim());
  if (!match) return null;
  const [, protocol, key, host, projectId] = match;
  return { key, url: `${protocol}://${host}/api/${projectId}/envelope/` };
}

const target = DSN ? parseDsn(DSN) : null;
const pending = [];

const baseEvent = () => ({
  event_id: randomUUID().replaceAll('-', ''),
  timestamp: Date.now() / 1000,
  platform: 'node',
  environment: process.env.GITHUB_ACTIONS ? 'production' : 'local',
  release: process.env.GITHUB_SHA ? `gta-dashboard@${process.env.GITHUB_SHA.slice(0, 12)}` : undefined,
  server_name: 'gta-collector',
  tags: { workflow: process.env.GITHUB_WORKFLOW || 'local', trigger: process.env.GITHUB_EVENT_NAME || 'manual' },
  extra: process.env.GITHUB_RUN_ID
    ? { run: `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` }
    : {},
});

function send(event) {
  if (!target) return;
  const body = [
    JSON.stringify({ event_id: event.event_id, sent_at: new Date().toISOString() }),
    JSON.stringify({ type: 'event' }),
    JSON.stringify(event),
  ].join('\n');
  pending.push(
    fetch(target.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${target.key}, sentry_client=gta-collector/1.0`,
      },
      body,
      signal: AbortSignal.timeout(8000),
    }).catch(() => {}),
  );
}

function parseStack(stack = '') {
  return stack
    .split('\n')
    .slice(1)
    .map((line) => /at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/.exec(line.trim()))
    .filter(Boolean)
    .map(([, fn, file, line, col]) => ({
      function: fn || '?',
      filename: file.replace(process.cwd(), ''),
      lineno: Number(line),
      colno: Number(col),
      in_app: !file.startsWith('node:') && !file.includes('node_modules'),
    }))
    .reverse();
}

export function captureException(error, { tags = {} } = {}) {
  const event = baseEvent();
  event.level = 'fatal';
  event.tags = { ...event.tags, ...tags };
  event.exception = {
    values: [
      {
        type: error?.name || 'Error',
        value: String(error?.message || error),
        stacktrace: error?.stack ? { frames: parseStack(error.stack) } : undefined,
      },
    ],
  };
  send(event);
}

/**
 * Source warnings from meta.errors (e.g. "ixp:AMS: HTTP 503 …"). Grouped per
 * source, not per message, because messages contain URLs and timestamps.
 */
export function captureSourceWarning(text) {
  const source = /^([\w^.-]+(?::[\w^.-]+)?):/.exec(text)?.[1] || 'unknown';
  const event = baseEvent();
  event.level = 'warning';
  event.message = { formatted: text.slice(0, 2000) };
  event.tags = { ...event.tags, source };
  event.fingerprint = ['collector-source-warning', source];
  send(event);
}

export async function flush() {
  await Promise.allSettled(pending);
}
