import fs from 'node:fs/promises';
import path from 'node:path';
import { collectStocks } from './lib/stocks.mjs';
import { collectOsint } from './lib/osint.mjs';
import { collectNetwork } from './lib/network.mjs';
import { collectInvestor } from './lib/investor.mjs';
import { collectHype } from './lib/hype.mjs';
import {
  appendTimeline,
  mergeDailyCounts,
  mergeDailySeries,
  mergeItems,
} from './lib/archive.mjs';

const DATA_DIR = path.resolve('data');

const RELEASE = {
  preorder: '2026-06-25T00:00:00+02:00',
  ps5Preload: '2026-11-10T00:00:00+01:00',
  xboxPreload: '2026-11-10T00:00:00Z',
  physical: '2026-11-12T00:00:00+01:00',
  release: '2026-11-19T00:00:00+01:00',
  storageGB: 212,
  priceUSD: 79.99,
  ultimateUSD: 99.99,
};

async function readJson(file, fallback = null) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function writeJson(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function runSlot(date = new Date()) {
  return date.getUTCHours() < 12 ? 'morning' : 'evening';
}

const descBy = (pick) => (a, b) => String(pick(b) ?? '').localeCompare(String(pick(a) ?? ''));

/**
 * Extends every rolling data window with the previous state so each run adds
 * to the history instead of replacing it. Mutates the collector outputs and
 * returns the two pure archive files (timeline + news archive).
 */
function extendArchives({
  at,
  stocks,
  osint,
  hype,
  investor,
  network,
  existingOsint,
  existingHype,
  existingInvestor,
  existingTimeline,
  existingNewsArchive,
}) {
  const seenAt = at.toISOString();

  // Wikipedia: API only returns the last 90 days → keep every day ever fetched.
  for (const [key, entry] of Object.entries(osint?.wikipedia || {})) {
    const previous = existingOsint?.wikipedia?.[key]?.series;
    if (previous?.length) entry.series = mergeDailySeries(previous, entry.series);
  }

  // Google News: 7-day rolling counts → daily history of all observed days.
  const newsArchive = {
    updated: seenAt,
    news: { ...(existingNewsArchive?.news || {}) },
    hype: { ...(existingNewsArchive?.hype || {}) },
    reddit: existingNewsArchive?.reddit || [],
    trends: existingNewsArchive?.trends || [],
  };

  for (const [key, entry] of Object.entries(osint?.news || {})) {
    const previous = existingOsint?.news?.[key];
    entry.history = mergeDailyCounts(previous?.history || previous?.series || [], entry.series || []);
    newsArchive.news[key] = mergeItems(
      newsArchive.news[key],
      entry.archiveItems || entry.items || [],
      (item) => item.link || item.title,
      { seenAt, sortKey: (item) => Date.parse(item.pubDate) ? new Date(item.pubDate).toISOString() : item.firstSeen },
    );
    delete entry.archiveItems;
  }

  // Hype topics: same 7-day window per topic.
  for (const topic of hype?.topics || []) {
    const previous = existingHype?.topics?.find((item) => item.key === topic.key);
    topic.history = mergeDailyCounts(previous?.history || previous?.series || [], topic.series || []);
    newsArchive.hype[topic.key] = mergeItems(
      newsArchive.hype[topic.key],
      topic.items || [],
      (item) => item.link || item.title,
      { seenAt, sortKey: (item) => Date.parse(item.pubDate) ? new Date(item.pubDate).toISOString() : item.firstSeen },
    );
  }

  // Reddit top posts and GTA-related Google Trends entries.
  newsArchive.reddit = mergeItems(newsArchive.reddit, osint?.reddit?.topPosts || [], (post) => post.id || post.link, {
    seenAt,
    sortKey: (post) => String(post.createdUtc ?? '').padStart(12, '0'),
  });
  const trendItems = Object.values(osint?.trends || {}).flatMap((geo) =>
    (geo?.gta || []).map((item) => ({ ...item, geo: geo.geo })),
  );
  newsArchive.trends = mergeItems(newsArchive.trends, trendItems, (item) => `${item.geo}|${item.title}|${item.pubDate}`, {
    seenAt,
    sortKey: (item) => item.firstSeen,
  });

  // Investor relations: keep every press release and filing ever listed (newest first).
  if (investor) {
    investor.pressReleases = mergeItems(existingInvestor?.pressReleases, investor.pressReleases, (item) => item.url || item.title, { seenAt })
      .sort(descBy((item) => item.date));
    investor.filings = mergeItems(existingInvestor?.filings, investor.filings, (item) => item.accession || item.url, { seenAt })
      .sort(descBy((item) => item.filingDate));
  }

  // Hourly snapshot of every point-in-time metric that the APIs do not keep themselves.
  const ok = (value) => value === 'ok';
  const lastWiki = (entry) => entry?.series?.at(-1) || null;
  const hypeLatest = hype?.history?.at(-1);
  const snapshot = {
    at: seenAt,
    stocks: Object.fromEntries(
      Object.entries(stocks?.series || {})
        .filter(([, stock]) => stock?.price != null && !stock.error)
        .map(([symbol, stock]) => [symbol, { price: stock.price, changePct: stock.changePct, volume: stock.volume }]),
    ),
    wikipedia: ok(osint?.sources?.wikipedia)
      ? Object.fromEntries(
          Object.entries(osint?.wikipedia || {}).map(([key, entry]) => [
            key,
            { date: lastWiki(entry)?.date ?? null, views: lastWiki(entry)?.views ?? null, recent7: entry.recent7, prev7: entry.prev7 },
          ]),
        )
      : null,
    news: Object.fromEntries(
      Object.entries(osint?.news || {})
        .filter(([, entry]) => !entry.error)
        .map(([key, entry]) => [key, { count24h: entry.count24h, count7d: entry.count7d }]),
    ),
    reddit: osint?.reddit && !osint.reddit.error
      ? {
          subscribers: osint.reddit.subscribers,
          posts24h: osint.reddit.posts24h,
          postsPerHour: osint.reddit.postsPerHour,
          topScore: osint.reddit.topPosts?.[0]?.score ?? null,
        }
      : null,
    steam: osint?.steam && !osint.steam.error ? { gta5: osint.steam.gta5 } : null,
    trends: Object.fromEntries(
      Object.entries(osint?.trends || {})
        .filter(([, entry]) => !entry.error)
        .map(([geo, entry]) => [geo, entry.gtaCount]),
    ),
    rockstar: osint?.rockstar
      ? { ok: osint.rockstar.ok, status: osint.rockstar.status, latencyMs: osint.rockstar.latencyMs }
      : null,
    playstation: osint?.playstation
      ? { ok: osint.playstation.ok, preloadMention: osint.playstation.preloadMention }
      : null,
    decix: ok(network?.sources?.decix) ? network.decix?.meta || null : null,
    hype: {
      score: hypeLatest && hypeLatest.at.slice(0, 13) === seenAt.slice(0, 13) ? hypeLatest.score : null,
      coverage: hypeLatest && hypeLatest.at.slice(0, 13) === seenAt.slice(0, 13) ? hypeLatest.coverage : null,
      topics: Object.fromEntries(
        (hype?.topics || [])
          .filter((topic) => topic.status === 'ok')
          .map((topic) => [topic.key, { count24h: topic.count24h, count7d: topic.count7d }]),
      ),
    },
  };

  const timeline = {
    updated: seenAt,
    description: 'Hourly append-only snapshots of all point-in-time GTA VI signals (null = source unavailable in that run).',
    snapshots: appendTimeline(existingTimeline?.snapshots, snapshot),
  };

  return { timeline, newsArchive };
}

/** Keep the dashboard's sitemap lastmod in sync with the latest data run (SEO freshness). */
async function touchSitemap(date) {
  const file = path.resolve('sitemap.xml');
  try {
    const xml = await fs.readFile(file, 'utf8');
    const day = date.toISOString().slice(0, 10);
    const updated = xml.replace(
      /(<loc>https:\/\/huskynarr\.is-a\.dev\/gta-dashboard\/<\/loc>\s*<lastmod>)[^<]*(<\/lastmod>)/,
      `$1${day}$2`,
    );
    if (updated !== xml) await fs.writeFile(file, updated, 'utf8');
  } catch {
    // Sitemap is optional for data collection.
  }
}

async function main() {
  const startedAt = new Date();

  const [
    existingStocks,
    existingOsint,
    existingNetwork,
    existingInvestor,
    existingHype,
    existingDecixHistory,
    existingTimeline,
    existingNewsArchive,
  ] = await Promise.all([
    readJson(path.join(DATA_DIR, 'stocks.json')),
    readJson(path.join(DATA_DIR, 'osint.json')),
    readJson(path.join(DATA_DIR, 'network.json')),
    readJson(path.join(DATA_DIR, 'investor.json')),
    readJson(path.join(DATA_DIR, 'hype.json')),
    readJson(path.join(DATA_DIR, 'decix-history.json')),
    readJson(path.join(DATA_DIR, 'timeline.json')),
    readJson(path.join(DATA_DIR, 'news-archive.json')),
  ]);

  const stocksPromise = collectStocks(existingStocks).catch((error) => ({
    ...(existingStocks || {}),
    updated: new Date().toISOString(),
    errors: [`collector:stocks: ${error.message}`],
  }));

  const osintPromise = collectOsint(existingOsint).catch((error) => ({
    ...(existingOsint || {}),
    updated: new Date().toISOString(),
    errors: [`collector:osint: ${error.message}`],
  }));

  const investorPromise = collectInvestor(existingInvestor).catch((error) => ({
    ...(existingInvestor || {}),
    updated: new Date().toISOString(),
    errors: [`collector:investor: ${error.message}`],
  }));

  const [stocks, osint, investor] = await Promise.all([
    stocksPromise,
    osintPromise,
    investorPromise,
  ]);

  const [network, hype] = await Promise.all([
    collectNetwork(existingNetwork, osint, existingDecixHistory).catch((error) => ({
      ...(existingNetwork || {}),
      updated: new Date().toISOString(),
      error: error.message,
    })),
    collectHype(existingHype, osint).catch((error) => ({
      ...(existingHype || {}),
      sources: { topics: 'degraded' },
      errors: [`collector:hype: ${error.message}`],
    })),
  ]);

  const { timeline, newsArchive } = extendArchives({
    at: startedAt,
    stocks,
    osint,
    hype,
    investor,
    network,
    existingOsint,
    existingHype,
    existingInvestor,
    existingTimeline,
    existingNewsArchive,
  });

  const finishedAt = new Date();

  const meta = {
    lastRun: finishedAt.toISOString(),
    startedAt: startedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    runSlot: runSlot(startedAt),
    release: RELEASE,
    sources: {
      stocks: stocks?.errors?.length ? 'degraded' : 'ok',
      osint: osint?.errors?.length ? 'degraded' : 'ok',
      network: network?.sources?.decix || 'degraded',
      decixHistory: network?.sources?.decixHistory || 'degraded',
      reddit: osint?.sources?.reddit || 'degraded',
      steam: osint?.sources?.steam || 'degraded',
      trends: osint?.sources?.trends || 'degraded',
      rockstar: osint?.sources?.rockstar || 'degraded',
      investor: investor?.sources?.ir || 'degraded',
      sec: investor?.sources?.sec || 'degraded',
      estimates: investor?.sources?.estimates || 'degraded',
      hype: hype?.sources?.topics || 'degraded',
    },
    counts: {
      stocks: Object.keys(stocks?.series || {}).length,
      stockHistory: Object.values(stocks?.series || {}).reduce(
        (total, stock) => total + (stock?.history?.length || 0),
        0,
      ),
      snapshots: stocks?.snapshots?.length || 0,
      wikiSeries: Object.keys(osint?.wikipedia || {}).length,
      newsQueries: Object.keys(osint?.news || {}).length,
      decixPoints: network?.decix?.traffic2d?.length || 0,
      decixHistoryPoints: network?.decixHistory?.points?.length || 0,
      decixDailyPeaks: network?.decixHistory?.dailyPeaks?.length || 0,
      filings: investor?.filings?.length || 0,
      pressReleases: investor?.pressReleases?.length || 0,
      hypeSnapshots: hype?.history?.length || 0,
      timelineSnapshots: timeline.snapshots.length,
      archivedNews: Object.values(newsArchive.news).reduce((total, items) => total + items.length, 0),
    },
    errors: [
      ...(stocks?.errors || []),
      ...(osint?.errors || []),
      ...(investor?.errors || []),
      ...(hype?.errors || []),
      ...(network?.decixError ? [`decix: ${network.decixError}`] : []),
    ],
  };

  const { decixHistory, ...networkOutput } = network;

  await touchSitemap(finishedAt);

  await Promise.all([
    writeJson(path.join(DATA_DIR, 'stocks.json'), stocks),
    writeJson(path.join(DATA_DIR, 'osint.json'), osint),
    writeJson(path.join(DATA_DIR, 'network.json'), networkOutput),
    writeJson(path.join(DATA_DIR, 'decix-history.json'), decixHistory || existingDecixHistory || null),
    writeJson(path.join(DATA_DIR, 'investor.json'), investor),
    writeJson(path.join(DATA_DIR, 'meta.json'), meta),
    writeJson(path.join(DATA_DIR, 'hype.json'), hype),
    writeJson(path.join(DATA_DIR, 'timeline.json'), timeline),
    writeJson(path.join(DATA_DIR, 'news-archive.json'), newsArchive),
  ]);

  console.log(
    `[collect] ${meta.runSlot} run finished in ${meta.durationMs}ms — ` +
      `${meta.counts.stocks} stocks, ${meta.counts.stockHistory} history points, ` +
      `${meta.counts.decixPoints} DE-CIX live points, ${meta.counts.decixHistoryPoints} history points, ${meta.counts.filings} filings`,
  );

  if (meta.errors.length) {
    console.warn(`[collect] ${meta.errors.length} source warning(s):`);
    for (const error of meta.errors) console.warn(`  - ${error}`);
  }
}

main().catch((error) => {
  console.error('[collect] fatal:', error);
  process.exitCode = 1;
});
