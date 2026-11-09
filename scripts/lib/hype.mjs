import { fetchText, parseRss, isoDay } from './http.mjs';
import { recordHypeHistory } from '../../assets/js/hype.js';

export const HYPE_TOPICS = [
  { key: 'retail', label: 'Handel & Marken', terms: '(Netto OR Edeka OR supermarket OR retailer OR merchandise OR Kooperation OR Vorbestellung)' },
  { key: 'hardware', label: 'Hardware & Setup', terms: '(PS5 OR Xbox OR OLED OR SSD OR hardware OR bundle)' },
  { key: 'creators', label: 'Creator & Social', terms: '(YouTube OR Twitch OR TikTok OR streamer OR creator OR viral)' },
  { key: 'release', label: 'Release & Download', terms: '(preload OR download OR launch OR edition OR Speicherplatz OR Veröffentlichung)' },
];

export function summarizeTopic(items, now = Date.now()) {
  const seen = new Set();
  const titles = new Set();
  const validItems = items.filter((item) => {
    const time = Date.parse(item.pubDate);
    const title = item.title?.trim().toLowerCase();
    if (!title || !/^https?:\/\//i.test(item.link) || !Number.isFinite(time) || time > now || now - time > 7 * 86400000 || seen.has(item.link) || titles.has(title)) return false;
    seen.add(item.link);
    titles.add(title);
    return true;
  }).sort((a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate));
  const series = Array.from({ length: 7 }, (_, index) => ({ date: isoDay(new Date(now - (6 - index) * 86400000)), count: 0 }));
  for (const item of validItems) {
    const day = series.find((point) => point.date === isoDay(new Date(item.pubDate)));
    if (day) day.count += 1;
  }
  return {
    count7d: validItems.length,
    count24h: validItems.filter((item) => now - Date.parse(item.pubDate) <= 86400000).length,
    publisherCount: new Set(validItems.map((item) => item.source).filter(Boolean)).size,
    capped: items.length >= 100,
    series,
    items: validItems.slice(0, 4).map(({ title, link, source, pubDate }) => ({ title, link, source, pubDate })),
  };
}

export async function collectHype(existing = null, osint = null, options = {}) {
  const now = options.now ?? Date.now();
  const request = options.fetchText || fetchText;
  const checkedAt = new Date(now).toISOString();
  const errors = [];
  const topics = await Promise.all(HYPE_TOPICS.map(async (topic) => {
    const query = `("GTA 6" OR "GTA VI" OR "Grand Theft Auto VI") ${topic.terms} when:7d`;
    const feedUrl = `https://news.google.com/rss/search?${new URLSearchParams({ q: query, hl: 'de', gl: 'DE', ceid: 'DE:de' })}`;
    try {
      const xml = await request(feedUrl, { headers: { Accept: 'application/rss+xml' } }, 12000, 2);
      if (!/<rss\b/i.test(xml) || !/<channel\b/i.test(xml)) throw new Error('Keine gültige RSS-Antwort');
      return { key: topic.key, label: topic.label, query, feedUrl, ...summarizeTopic(parseRss(xml), now), status: 'ok', updated: checkedAt };
    } catch (error) {
      errors.push(`hype:${topic.key}: ${error.message}`);
      const previous = existing?.topics?.find((item) => item.key === topic.key);
      return { ...(previous || { count7d: null, count24h: null, items: [], series: [] }), key: topic.key, label: topic.label, query, feedUrl, status: previous?.updated ? 'stale' : 'unavailable', lastAttemptAt: checkedAt, error: error.message };
    }
  }));
  return { updated: checkedAt, topics, history: recordHypeHistory(existing?.history, osint, now), sources: { topics: errors.length ? 'degraded' : 'ok' }, errors };
}
