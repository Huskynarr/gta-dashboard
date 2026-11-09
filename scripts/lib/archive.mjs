// Append-only helpers: every collector run extends the archive instead of
// replacing it, so the full November → December history survives until the
// final archive snapshot.

/**
 * Merge two lists of objects by a key. Newer entries win for identical keys,
 * unless `combine` is given, which receives (old, fresh) and returns the merged entry.
 */
export function mergeBy(oldList = [], newList = [], keyOf, { combine, sort, limit } = {}) {
  const map = new Map();
  for (const item of Array.isArray(oldList) ? oldList : []) {
    const key = item ? keyOf(item) : null;
    if (key != null && key !== '') map.set(key, item);
  }
  for (const item of Array.isArray(newList) ? newList : []) {
    const key = item ? keyOf(item) : null;
    if (key == null || key === '') continue;
    const previous = map.get(key);
    map.set(key, previous && combine ? combine(previous, item) : item);
  }
  let merged = [...map.values()];
  if (sort) merged.sort(sort);
  if (limit) merged = merged.slice(-limit);
  return merged;
}

const byDate = (a, b) => String(a.date).localeCompare(String(b.date));

/**
 * Daily series ({date, ...}) where the latest window overwrites overlapping days.
 * Use for sources that return final values for past days (e.g. Wikipedia pageviews).
 */
export function mergeDailySeries(oldSeries, newSeries) {
  return mergeBy(oldSeries, newSeries, (point) => point.date, { sort: byDate });
}

/**
 * Daily counts taken from rolling 7-day feeds. The oldest day of a rolling
 * window is only partially covered, so keep the highest count ever observed.
 */
export function mergeDailyCounts(oldSeries, newSeries, field = 'count') {
  return mergeBy(oldSeries, newSeries, (point) => point.date, {
    sort: byDate,
    combine: (previous, fresh) => ({
      ...fresh,
      [field]: Math.max(Number(previous[field]) || 0, Number(fresh[field]) || 0),
    }),
  });
}

/** Item archive (news, posts, filings …): keeps first-seen timestamp, updates the rest. */
export function mergeItems(oldItems, newItems, keyOf, { sortKey, limit, seenAt = new Date().toISOString() } = {}) {
  const stamped = (newItems || []).map((item) => ({ ...item, firstSeen: item.firstSeen || seenAt }));
  return mergeBy(oldItems, stamped, keyOf, {
    combine: (previous, fresh) => ({ ...previous, ...fresh, firstSeen: previous.firstSeen || fresh.firstSeen }),
    sort: sortKey
      ? (a, b) => String(sortKey(a) ?? '').localeCompare(String(sortKey(b) ?? ''))
      : undefined,
    limit,
  });
}

/** Hourly snapshot timeline: one entry per UTC hour, later runs in the same hour replace it. */
export function appendTimeline(existing, snapshot, limit = 20000) {
  return mergeBy(existing, [snapshot], (entry) => String(entry.at).slice(0, 13), {
    sort: (a, b) => String(a.at).localeCompare(String(b.at)),
    limit,
  });
}

const descBy = (pick) => (a, b) => String(pick(b) ?? '').localeCompare(String(pick(a) ?? ''));

/**
 * Extends every rolling data window with the previous state so each run adds
 * to the history instead of replacing it. Mutates the collector outputs and
 * returns the two pure archive files (timeline + news archive).
 */
export function extendArchives({
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
    entry.history = mergeDailyCounts(
      mergeDailyCounts(previous?.history || previous?.series || [], entry.history || []),
      entry.series || [],
    );
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
    topic.history = mergeDailyCounts(
      mergeDailyCounts(previous?.history || previous?.series || [], topic.history || []),
      topic.series || [],
    );
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
