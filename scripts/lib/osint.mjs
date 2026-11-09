import {
  compactDate,
  daysAgo,
  fetchJson,
  fetchText,
  fetchWithTimeout,
  isoDay,
  parseRss,
  sleep,
  stripTags,
} from './http.mjs';

const WIKI_ARTICLES = [
  {
    key: 'gta_en',
    label: 'GTA VI · EN',
    project: 'en.wikipedia',
    article: 'Grand_Theft_Auto_VI',
  },
  {
    key: 'gta_de',
    label: 'GTA VI · DE',
    project: 'de.wikipedia',
    article: 'Grand_Theft_Auto_VI',
  },
  {
    key: 'sick_stand',
    label: 'Krankenstand · DE',
    project: 'de.wikipedia',
    article: 'Krankenstand',
  },
  {
    key: 'sick_ability',
    label: 'Arbeitsunfähigkeit · DE',
    project: 'de.wikipedia',
    article: 'Arbeitsunfähigkeit',
  },
];

const NEWS_QUERIES = [
  {
    key: 'gta_en',
    label: 'GTA VI · EN',
    query: '("GTA 6" OR "Grand Theft Auto VI")',
    hl: 'en-US',
    gl: 'US',
    ceid: 'US:en',
  },
  {
    key: 'gta_de',
    label: 'GTA VI · DE',
    query: '("GTA 6" OR "Grand Theft Auto VI")',
    hl: 'de',
    gl: 'DE',
    ceid: 'DE:de',
  },
  {
    key: 'sick_de',
    label: 'Krankenstand · DE',
    query: '(Krankmeldung OR Krankenstand OR Krankheitstage OR Arbeitsunfähigkeit)',
    hl: 'de',
    gl: 'DE',
    ceid: 'DE:de',
  },
  {
    key: 'rockstar',
    label: 'Rockstar Newswire',
    query: 'site:rockstargames.com',
    hl: 'en-US',
    gl: 'US',
    ceid: 'US:en',
  },
];

const RELEASE_DATES = {
  preorder: '2026-06-25T00:00:00+02:00',
  ps5Preload: '2026-11-10T00:00:00+01:00',
  xboxPreload: '2026-11-10T00:00:00Z',
  physical: '2026-11-12T00:00:00+01:00',
  release: '2026-11-19T00:00:00+01:00',
};

function sumViews(series) {
  return series.reduce((total, point) => total + point.views, 0);
}

function windowSum(series, start, end) {
  return series
    .slice(start, end)
    .reduce((total, point) => total + point.views, 0);
}

async function collectWikipedia() {
  const end = compactDate();
  const start = compactDate(daysAgo(90));
  const output = {};
  const errors = [];

  for (const article of WIKI_ARTICLES) {
    try {
      const url =
        `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/` +
        `${article.project}/all-access/user/${encodeURIComponent(article.article)}` +
        `/daily/${start}/${end}`;

      const json = await fetchJson(url, {
        headers: { Accept: 'application/json' },
      });

      const series = (json.items || []).map((item) => ({
        date: `${item.timestamp.slice(0, 4)}-${item.timestamp.slice(4, 6)}-${item.timestamp.slice(6, 8)}`,
        views: item.views,
      }));

      output[article.key] = {
        ...article,
        total: sumViews(series),
        recent7: windowSum(series, -7),
        prev7: windowSum(series, -14, -7),
        series,
      };
    } catch (error) {
      errors.push(`wiki:${article.key}: ${error.message}`);
      output[article.key] = {
        ...article,
        total: 0,
        recent7: 0,
        prev7: 0,
        series: [],
        error: error.message,
      };
    }

    await sleep(160);
  }

  return { output, errors };
}

function newsUrl(query) {
  const params = new URLSearchParams({
    q: `${query.query} when:7d`,
    hl: query.hl,
    gl: query.gl,
    ceid: query.ceid,
  });
  return `https://news.google.com/rss/search?${params.toString()}`;
}

function dailyCounts(items) {
  const counts = new Map();
  const today = new Date();

  for (let i = 6; i >= 0; i -= 1) {
    const d = daysAgo(i, today);
    counts.set(isoDay(d), 0);
  }

  for (const item of items) {
    const date = new Date(item.pubDate);
    if (Number.isNaN(date.getTime())) continue;
    const key = isoDay(date);
    if (counts.has(key)) counts.set(key, counts.get(key) + 1);
  }

  return [...counts.entries()].map(([date, count]) => ({ date, count }));
}

async function collectNews() {
  const output = {};
  const errors = [];

  for (const query of NEWS_QUERIES) {
    try {
      const xml = await fetchText(newsUrl(query), {
        headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
      });

      const parsed = parseRss(xml);
      const now = Date.now();
      const items = parsed
        .map((item) => ({
          ...item,
          timestamp: new Date(item.pubDate).getTime(),
        }))
        .filter((item) => Number.isFinite(item.timestamp))
        .sort((a, b) => b.timestamp - a.timestamp);

      const last24h = items.filter(
        (item) => now - item.timestamp <= 24 * 60 * 60 * 1000,
      );

      output[query.key] = {
        key: query.key,
        label: query.label,
        query: query.query,
        count7d: items.length,
        count24h: last24h.length,
        series: dailyCounts(items),
        items: items.slice(0, 6).map((item) => ({
          title: item.title,
          link: item.link,
          source: item.source,
          pubDate: item.pubDate,
        })),
      };
    } catch (error) {
      errors.push(`news:${query.key}: ${error.message}`);
      output[query.key] = {
        key: query.key,
        label: query.label,
        query: query.query,
        count7d: 0,
        count24h: 0,
        series: [],
        items: [],
        error: error.message,
      };
    }

    await sleep(250);
  }

  return { output, errors };
}

async function collectReddit(existing) {
  try {
    const info = await fetchJson(
      'https://arctic-shift.photon-reddit.com/api/subreddits/search?subreddit=GTA6',
      { headers: { Accept: 'application/json' } },
    );

    const subreddit = info?.data?.[0];
    if (!subreddit) throw new Error('subreddit not found');

    const postsJson = await fetchJson(
      'https://arctic-shift.photon-reddit.com/api/posts/search' +
        '?subreddit=GTA6&limit=100&sort=desc' +
        '&fields=created_utc,score,title,num_comments,id',
      { headers: { Accept: 'application/json' } },
    );

    const posts = (postsJson?.data || []).map((post) => ({
      id: post.id,
      title: post.title,
      score: post.score ?? 0,
      comments: post.num_comments ?? 0,
      createdUtc: post.created_utc,
      link: post.id
        ? `https://www.reddit.com/r/GTA6/comments/${post.id}`
        : 'https://www.reddit.com/r/GTA6/',
    }));

    const now = Date.now() / 1000;
    const posts24h = posts.filter((post) => now - post.createdUtc <= 86400);
    const oldest = posts.at(-1)?.createdUtc ?? now;
    const newest = posts[0]?.createdUtc ?? now;
    const sampleHours = Math.max((newest - oldest) / 3600, 1);
    const peakPost = posts.reduce(
      (best, post) => (post.score > best.score ? post : best),
      existing?.peakPost || { score: 0 },
    );

    return {
      subreddit: 'GTA6',
      peakPost: peakPost.score
        ? {
            score: peakPost.score,
            title: peakPost.title,
            link: peakPost.link,
            createdUtc: peakPost.createdUtc,
          }
        : existing?.peakPost || null,
      subscribers: subreddit.subscribers ?? null,
      posts24h: posts24h.length,
      posts7d: null,
      sampleSize: posts.length,
      sampleHours: Math.round(sampleHours * 10) / 10,
      postsPerHour: Math.round((posts.length / sampleHours) * 10) / 10,
      topPosts: posts
        .slice()
        .sort((a, b) => b.score - a.score)
        .slice(0, 5),
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      ...(existing || {}),
      error: error.message,
      fetchedAt: new Date().toISOString(),
    };
  }
}

async function collectSteam() {
  try {
    const json = await fetchJson(
      'https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=271590',
      { headers: { Accept: 'application/json' } },
    );

    return {
      gta5: json?.response?.player_count ?? null,
      appid: 271590,
      label: 'GTA V · Steam',
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    return { gta5: null, error: error.message };
  }
}

function parseTrends(xml) {
  const items = [];
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];

  for (const block of blocks) {
    const title = block.match(/<title>([\s\S]*?)<\/title>/i);
    const traffic = block.match(/<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/i);
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const newsTitle = block.match(/<ht:news_item_title>([\s\S]*?)<\/ht:news_item_title>/i);
    const newsUrl = block.match(/<ht:news_item_url>([\s\S]*?)<\/ht:news_item_url>/i);
    const newsSource = block.match(/<ht:news_item_source>([\s\S]*?)<\/ht:news_item_source>/i);

    items.push({
      title: title ? stripTags(title[1]) : '',
      traffic: traffic ? stripTags(traffic[1]) : '',
      pubDate: pubDate ? stripTags(pubDate[1]) : '',
      newsTitle: newsTitle ? stripTags(newsTitle[1]) : '',
      newsUrl: newsUrl ? stripTags(newsUrl[1]) : '',
      newsSource: newsSource ? stripTags(newsSource[1]) : '',
    });
  }

  return items;
}

async function collectTrends() {
  const output = {};
  const errors = [];
  const gtaPattern = /gta|grand theft auto|rockstar|leonida|vice city/i;

  for (const geo of ['DE', 'US']) {
    try {
      const xml = await fetchText(`https://trends.google.com/trending/rss?geo=${geo}`, {
        headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
      });

      const items = parseTrends(xml);
      const gta = items.filter((item) =>
        gtaPattern.test(`${item.title} ${item.newsTitle}`),
      );

      output[geo.toLowerCase()] = {
        geo,
        items: items.slice(0, 10),
        gta,
        gtaCount: gta.length,
      };
    } catch (error) {
      errors.push(`trends:${geo}: ${error.message}`);
      output[geo.toLowerCase()] = { geo, items: [], gta: [], gtaCount: 0, error: error.message };
    }

    await sleep(200);
  }

  return { output, errors };
}

async function probeRockstar() {
  const checkedAt = new Date().toISOString();

  try {
    const started = performance.now();
    const res = await fetchWithTimeout(
      'https://www.rockstargames.com/VI',
      { headers: { Accept: 'text/html,application/xhtml+xml' } },
      20000,
    );
    const latencyMs = Math.round(performance.now() - started);
    const text = await res.text();
    const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

    return {
      status: res.status,
      ok: res.ok,
      latencyMs,
      bytes: text.length,
      title: titleMatch ? stripTags(titleMatch[1]) : '',
      preloadMention: /pre-?load|pre-?download/i.test(text),
      checkedAt,
    };
  } catch (error) {
    return {
      status: null,
      ok: false,
      latencyMs: null,
      bytes: 0,
      title: '',
      preloadMention: false,
      error: error.message,
      checkedAt,
    };
  }
}

async function probePlaystation() {
  try {
    const text = await fetchText(
      'https://www.playstation.com/en-us/support/games/gta-vi-support/',
      { headers: { Accept: 'text/html,application/xhtml+xml' } },
      20000,
    );

    return {
      ok: true,
      preloadMention: /pre-?load|pre-?download/i.test(text),
      releaseMention: /november 19, 2026/i.test(text),
      storageMention: /212\s?gb/i.test(text),
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      ok: false,
      preloadMention: false,
      releaseMention: false,
      storageMention: false,
      error: error.message,
      checkedAt: new Date().toISOString(),
    };
  }
}

function preloadStatus(now = new Date()) {
  const preload = new Date(RELEASE_DATES.ps5Preload);
  const release = new Date(RELEASE_DATES.release);

  if (now >= release) return 'released';
  if (now >= preload) return 'preload';
  return 'upcoming';
}

export async function collectOsint(existing = null) {
  const [wikipedia, news, reddit, steam, trends, rockstar, playstation] =
    await Promise.all([
      collectWikipedia(),
      collectNews(),
      collectReddit(existing?.reddit),
      collectSteam(),
      collectTrends(),
      probeRockstar(),
      probePlaystation(),
    ]);

  const errors = [
    ...wikipedia.errors,
    ...news.errors,
    ...trends.errors,
  ];

  const output = {
    updated: new Date().toISOString(),
    wikipedia: wikipedia.output,
    news: news.output,
    reddit,
    steam,
    trends: trends.output,
    rockstar,
    playstation,
    preload: {
      ...RELEASE_DATES,
      storageGB: 212,
      status: preloadStatus(),
      ps5Confirmed: playstation.preloadMention,
      xboxConfirmed: true,
      note:
        'PS5: 10.11.2026, 00:00 lokal · Xbox: 10.11.2026, 00:00 GMT ' +
        '(01:00 CET) · Physical Code-in-Box: 12.11.2026 · Release: 19.11.2026, 00:00 lokal',
    },
    sources: {
      wikipedia: errors.some((e) => e.startsWith('wiki:')) ? 'degraded' : 'ok',
      news: errors.some((e) => e.startsWith('news:')) ? 'degraded' : 'ok',
      reddit: reddit?.error ? 'degraded' : 'ok',
      steam: steam?.error ? 'degraded' : 'ok',
      trends: errors.some((e) => e.startsWith('trends:')) ? 'degraded' : 'ok',
      rockstar: rockstar?.ok ? 'ok' : 'degraded',
      playstation: playstation?.ok ? 'ok' : 'degraded',
    },
    errors,
  };

  if (existing?.wikipedia) {
    for (const [key, value] of Object.entries(existing.wikipedia)) {
      if (!output.wikipedia[key]?.series?.length && value?.series?.length) {
        output.wikipedia[key] = value;
      }
    }
  }

  if (existing?.news) {
    for (const [key, value] of Object.entries(existing.news)) {
      if (!output.news[key]?.items?.length && value?.items?.length) {
        output.news[key] = value;
      }
    }
  }

  return output;
}
