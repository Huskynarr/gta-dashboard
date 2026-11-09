import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeHype, recordHypeHistory } from '../../assets/js/hype.js';
import { collectHype, summarizeTopic } from '../lib/hype.mjs';

const now = Date.parse('2026-11-09T12:00:00Z');
const fixture = () => ({
  updated: new Date(now).toISOString(),
  wikipedia: { gta_en: { recent7: 100, prev7: 100 }, gta_de: { recent7: 50, prev7: 50 } },
  news: { gta_en: { count7d: 70, count24h: 10 } },
  reddit: { postsPerHour: 15.625, fetchedAt: new Date(now).toISOString(), sampleSize: 100 },
  sources: { wikipedia: 'ok', news: 'ok', reddit: 'ok' },
});

test('neutral inputs produce a full, bounded score; measured zeros stay available', () => {
  const data = fixture();
  assert.equal(analyzeHype(data, now).score, 50);
  data.wikipedia.gta_en.recent7 = 0;
  data.wikipedia.gta_de.recent7 = 0;
  data.news.gta_en.count24h = 0;
  data.reddit.postsPerHour = 0;
  const result = analyzeHype(data, now);
  assert.equal(result.coverage, 3);
  assert.ok(result.score >= 0 && result.score < 50);
});

test('missing or broken sources are excluded and weights renormalize', () => {
  const data = fixture();
  data.sources.news = 'degraded';
  data.reddit.error = 'network error';
  const result = analyzeHype(data, now);
  assert.equal(result.score, 50);
  assert.equal(result.coverage, 1);
  assert.equal(result.channels[0].effectiveWeight, 100);
  assert.equal(result.channels[1].effectiveWeight, 0);
  assert.equal(analyzeHype(null, now).score, null);
});

test('stale, invalid and future timestamps cannot yield a current score', () => {
  for (const updated of ['2026-11-06T12:00:00Z', 'invalid', '2026-11-10T12:00:00Z']) {
    const result = analyzeHype({ ...fixture(), updated }, now);
    assert.equal(result.score, null);
    assert.equal(result.coverage, 0);
  }
  const data = fixture();
  data.reddit.fetchedAt = '2026-11-01T12:00:00Z';
  assert.equal(analyzeHype(data, now).coverage, 2);
});

test('an empty weekly news sample has no baseline and is not scored', () => {
  const data = fixture();
  data.news.gta_en = { count7d: 0, count24h: 0 };
  assert.equal(analyzeHype(data, now).channels[1].status, 'unavailable');
});

test('Wikipedia requires both languages so complete snapshots share the same baseline', () => {
  const data = fixture();
  delete data.wikipedia.gta_de;
  const result = analyzeHype(data, now);
  assert.equal(result.coverage, 2);
  assert.equal(result.channels[0].status, 'unavailable');
});

test('history records actual observation time once per hour and skips absent scores', () => {
  const data = fixture();
  data.updated = '2026-11-09T11:10:00Z';
  let history = recordHypeHistory([], data, now);
  data.updated = '2026-11-09T11:50:00Z';
  history = recordHypeHistory(history, data, now);
  assert.equal(history.length, 1);
  assert.equal(history[0].at, '2026-11-09T11:50:00.000Z');
  assert.deepEqual(recordHypeHistory(history, null, now), history);
  data.updated = '2026-11-09T12:00:00Z';
  assert.equal(recordHypeHistory(history, data, now).length, 2);
});

test('history removes obsolete versions, invalid scores and points older than 90 days', () => {
  const seed = recordHypeHistory([], fixture(), now)[0];
  const history = recordHypeHistory([
    { ...seed, at: '2026-01-01T00:00:00Z' },
    { ...seed, at: '2026-11-09T10:00:00Z', version: 'other' },
    { ...seed, at: '2026-11-09T11:00:00Z', score: 1000 },
    { ...seed, at: 'invalid' },
  ], null, now);
  assert.deepEqual(history, []);
});

test('RSS summaries remove duplicates, unsafe links, future and old articles', () => {
  const article = { title: 'GTA VI im Handel', link: 'https://example.com/1', source: 'Publisher', pubDate: new Date(now - 3600000).toISOString() };
  const result = summarizeTopic([
    article, article,
    { ...article, link: 'https://example.com/2' },
    { ...article, title: 'Future', link: 'https://example.com/future', pubDate: new Date(now + 1000).toISOString() },
    { ...article, title: 'Old', link: 'https://example.com/old', pubDate: '2025-11-09' },
    { ...article, title: 'Unsafe', link: 'javascript:alert(1)' },
    { ...article, title: 'No date', link: 'https://example.com/no-date', pubDate: 'invalid' },
  ], now);
  assert.equal(result.count7d, 1);
  assert.equal(result.count24h, 1);
  assert.equal(result.publisherCount, 1);
});

test('a failed topic keeps its original data timestamp while healthy feeds continue', async () => {
  const previous = { key: 'retail', count7d: 12, count24h: 2, updated: '2026-11-08T12:00:00Z', items: [{ title: 'Old data' }] };
  const result = await collectHype({ topics: [previous] }, fixture(), {
    now,
    fetchText: async (url) => {
      if (new URL(url).searchParams.get('q').includes('Netto')) throw new Error('offline');
      return '<rss><channel></channel></rss>';
    },
  });
  const retail = result.topics.find((topic) => topic.key === 'retail');
  assert.equal(retail.status, 'stale');
  assert.equal(retail.updated, previous.updated);
  assert.equal(retail.count7d, 12);
  assert.equal(result.topics.filter((topic) => topic.status === 'ok').length, 3);
  assert.equal(result.sources.topics, 'degraded');
  assert.equal(result.history.length, 1);
});

test('an HTML challenge page cannot masquerade as a successful empty feed', async () => {
  const result = await collectHype(null, null, { now, fetchText: async () => '<html><body>Access denied</body></html>' });
  assert.equal(result.errors.length, 4);
  assert.ok(result.topics.every((topic) => topic.status === 'unavailable' && topic.count7d === null));
  const retry = await collectHype(result, null, { now, fetchText: async () => { throw new Error('offline'); } });
  assert.ok(retry.topics.every((topic) => topic.status === 'unavailable' && topic.count7d === null));
});
