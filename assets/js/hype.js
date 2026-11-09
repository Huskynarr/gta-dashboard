export const HYPE_VERSION = 'hype-v1';
const MAX_AGE_MS = 48 * 60 * 60 * 1000;
const clamp = (value) => Math.max(0, Math.min(100, value));
const valid = (value) => Number.isFinite(value) && value >= 0;

function freshness(timestamp, now) {
  const age = now - Date.parse(timestamp);
  return Number.isFinite(age) && age >= -300000 && age <= MAX_AGE_MS;
}

// These are attention proxies. The weights are editorial choices, not a sales model.
export function analyzeHype(osint, now = Date.now()) {
  const channels = [
    { key: 'wiki', label: 'Suchinteresse', weight: 45, score: null, status: 'unavailable', url: 'https://en.wikipedia.org/wiki/Grand_Theft_Auto_VI', source: 'Wikimedia · EN/DE' },
    { key: 'news', label: 'Medienecho', weight: 35, score: null, status: 'unavailable', url: 'https://news.google.com/search?q=GTA%20VI&hl=de&gl=DE&ceid=DE%3Ade', source: 'Google News · EN' },
    { key: 'reddit', label: 'Community', weight: 20, score: null, status: 'unavailable', url: 'https://www.reddit.com/r/GTA6/', source: 'r/GTA6 · Arctic Shift' },
  ];
  const isFresh = freshness(osint?.updated, now);
  const ratios = ['gta_en', 'gta_de'].map((key) => osint?.wikipedia?.[key])
    .filter((wiki) => !wiki?.error && valid(wiki?.recent7) && wiki?.prev7 > 0)
    .map((wiki) => wiki.recent7 / wiki.prev7);
  if (ratios.length === 2 && osint?.sources?.wikipedia !== 'degraded') {
    const ratio = ratios.reduce((sum, value) => sum + value, 0) / ratios.length;
    Object.assign(channels[0], { score: clamp(50 + (ratio - 1) * 42), changePct: (ratio - 1) * 100, status: isFresh ? 'ok' : 'stale' });
  }
  const news = osint?.news?.gta_en;
  if (!news?.error && valid(news?.count24h) && news?.count7d > 0 && osint?.sources?.news !== 'degraded') {
    const ratio = (news.count24h + 0.6) / (news.count7d / 7 + 0.6);
    Object.assign(channels[1], { score: clamp(50 + (ratio - 1) * 42), count24h: news.count24h, count7d: news.count7d, status: isFresh ? 'ok' : 'stale' });
  }
  const reddit = osint?.reddit;
  if (!reddit?.error && valid(reddit?.postsPerHour) && osint?.sources?.reddit !== 'degraded') {
    Object.assign(channels[2], { score: clamp(reddit.postsPerHour * 3.2), postsPerHour: reddit.postsPerHour, sampleSize: reddit.sampleSize, sampleHours: reddit.sampleHours, status: isFresh && freshness(reddit.fetchedAt || osint.updated, now) ? 'ok' : 'stale' });
  }
  const available = channels.filter((channel) => channel.status === 'ok');
  const weight = available.reduce((sum, channel) => sum + channel.weight, 0);
  for (const channel of channels) channel.effectiveWeight = channel.status === 'ok' ? channel.weight / weight * 100 : 0;
  const score = weight ? Math.round(available.reduce((sum, channel) => sum + channel.score * channel.weight, 0) / weight) : null;
  return {
    version: HYPE_VERSION,
    score,
    label: score == null ? 'Daten fehlen' : score >= 75 ? 'Hohe Aufmerksamkeit' : score >= 50 ? 'Erhöhte Aufmerksamkeit' : 'Verhaltene Aufmerksamkeit',
    coverage: available.length,
    signature: available.map((channel) => channel.key).join('+'),
    channels,
    updated: osint?.updated || null,
  };
}

export function recordHypeHistory(existing = [], osint, now = Date.now()) {
  const analysis = analyzeHype(osint, now);
  const history = new Map();
  for (const item of existing) {
    const at = Date.parse(item.at);
    if (Number.isFinite(at) && now - at <= 90 * 86400000 && at <= now && valid(item.score) && item.score <= 100 && item.version === HYPE_VERSION) {
      history.set(item.at.slice(0, 13), item);
    }
  }
  if (analysis.score != null) {
    const at = new Date(analysis.updated).toISOString();
    history.set(at.slice(0, 13), { at, version: HYPE_VERSION, score: analysis.score, coverage: analysis.coverage, signature: analysis.signature });
  }
  return [...history.values()].sort((a, b) => a.at.localeCompare(b.at)).slice(-2160);
}
