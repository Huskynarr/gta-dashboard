import { fetchJson, sleep } from './http.mjs';

const DECIX_HEADERS = {
  Accept: 'application/json, text/javascript, */*; q=0.01',
  Referer: 'https://www.de-cix.net/en/locations/frankfurt/statistics',
  'X-Requested-With': 'XMLHttpRequest',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
};

export const MONTH_START = Date.UTC(2026, 10, 1); // 1. November 2026

// Additional DE-CIX locations in other time zones. Same API as Frankfurt, so a
// GTA-driven spike should show up as a wave (PS5: local midnight) or as one
// simultaneous jump (Xbox: 00:00 GMT) across the sites.
export const DECIX_SITES = [
  { key: 'NYC', label: 'New York', timeZone: 'America/New_York', page: 'new-york' },
  { key: 'MAD', label: 'Madrid', timeZone: 'Europe/Madrid', page: 'madrid' },
  { key: 'DXB', label: 'Dubai', timeZone: 'Asia/Dubai', page: 'dubai' },
];
// 5-minute points: ~288/day → 60000 covers well beyond mid-December.
const HISTORY_LIMIT = 60000;

function normalizeMeta(meta = {}) {
  return {
    allTimePeak: meta['all-time-peak'] ?? null,
    current: meta.current ?? null,
    graphAverage: meta['graph-average'] ?? null,
    graphPeak: meta['graph-peak'] ?? null,
  };
}

function normalizeTraffic(points = []) {
  return points
    .map((point) => ({
      clock: point.clock,
      value: point.value,
    }))
    .filter(
      (point) =>
        Number.isFinite(point.clock) && Number.isFinite(point.value),
    );
}

async function fetchDecix(range, site = 'FRA', page = 'frankfurt') {
  const json = await fetchJson(
    `https://www.de-cix.net/api/traffic/${site}/${range}`,
    {
      headers: {
        ...DECIX_HEADERS,
        Referer: `https://www.de-cix.net/en/locations/${page}/statistics`,
      },
    },
    30000,
  );

  return {
    meta: normalizeMeta(json.meta),
    traffic: normalizeTraffic(json.traffic),
  };
}

export function mergeHistory(existingPoints = [], newPoints = []) {
  const byClock = new Map();

  for (const point of existingPoints) {
    if (Array.isArray(point) && Number.isFinite(point[0])) {
      byClock.set(point[0], point[1]);
    }
  }

  for (const point of newPoints) {
    if (point?.clock && Number.isFinite(point.value)) {
      byClock.set(point.clock, point.value);
    }
  }

  return [...byClock.entries()]
    .filter(([clock]) => clock >= MONTH_START)
    .sort((a, b) => a[0] - b[0])
    .slice(-HISTORY_LIMIT);
}

export function buildDailyPeaks(points) {
  const days = new Map();

  for (const [clock, value] of points) {
    const date = new Date(clock).toISOString().slice(0, 10);
    const current = days.get(date);

    if (!current || value > current.peak) {
      days.set(date, { date, peak: value, at: clock });
    }
  }

  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function peakOf(points) {
  return points.reduce(
    (best, [clock, value]) => (value > best.value ? { value, clock } : best),
    { value: 0, clock: null },
  );
}

/** One extra DE-CIX site: live meta plus an append-only 5-minute history since 1 November. */
async function collectSite(site, existing = null) {
  const [twoDays, oneMonth] = await Promise.allSettled([
    fetchDecix('2days', site.key, site.page),
    fetchDecix('1month', site.key, site.page),
  ]);
  const fresh = [
    ...(oneMonth.status === 'fulfilled' ? oneMonth.value.traffic : []),
    ...(twoDays.status === 'fulfilled' ? twoDays.value.traffic : []),
  ];
  const points = mergeHistory(existing?.points || [], fresh);
  const peak = peakOf(points);
  const live = twoDays.status === 'fulfilled' ? twoDays.value : oneMonth.status === 'fulfilled' ? oneMonth.value : null;
  const failed = [twoDays, oneMonth].filter((result) => result.status === 'rejected');

  return {
    key: site.key,
    label: site.label,
    timeZone: site.timeZone,
    status: failed.length ? (points.length ? 'degraded' : 'missing') : 'ok',
    ...(failed.length ? { error: failed[0].reason?.message || 'DE-CIX request failed' } : {}),
    fetchedAt: live ? new Date().toISOString() : existing?.fetchedAt || null,
    meta: live
      ? { current: live.meta.current, allTimePeak: live.meta.allTimePeak }
      : existing?.meta || null,
    monthPeak: peak.value || null,
    monthPeakAt: peak.clock,
    points,
    dailyPeaks: buildDailyPeaks(points),
  };
}

export async function collectDecixSites(existing = null) {
  const sites = {};
  for (const site of DECIX_SITES) {
    sites[site.key] = await collectSite(site, existing?.sites?.[site.key]).catch((error) => ({
      ...(existing?.sites?.[site.key] || { key: site.key, label: site.label, timeZone: site.timeZone, points: [] }),
      status: existing?.sites?.[site.key]?.points?.length ? 'degraded' : 'missing',
      error: error.message,
    }));
    await sleep(250);
  }
  return {
    updated: new Date().toISOString(),
    source: 'DE-CIX traffic API',
    start: new Date(MONTH_START).toISOString(),
    sites,
  };
}

export async function collectNetwork(
  existing = null,
  osint = null,
  existingHistory = null,
  existingSites = null,
) {
  const output = {
    updated: new Date().toISOString(),
    decix: existing?.decix || null,
    decixHistory: existingHistory || null,
    rockstar: osint?.rockstar || existing?.rockstar || null,
    preload: osint?.preload || existing?.preload || null,
    sources: {},
  };

  const [twoDaysResult, oneMonthResult] = await Promise.allSettled([
    fetchDecix('2days'),
    fetchDecix('1month'),
  ]);

  if (twoDaysResult.status === 'fulfilled') {
    const twoDays = twoDaysResult.value;
    output.decix = {
      fetchedAt: new Date().toISOString(),
      meta: {
        ...twoDays.meta,
        allTimePeakDate: '2026-10-14',
        monthPeak: output.decixHistory?.monthPeak || null,
        monthPeakAt: output.decixHistory?.monthPeakAt || null,
      },
      traffic2d: twoDays.traffic,
    };
    output.sources.decix = 'ok';
  } else {
    output.sources.decix = 'degraded';
    output.decixError = twoDaysResult.reason?.message || 'DE-CIX 2days failed';
  }

  if (oneMonthResult.status === 'fulfilled') {
    const oneMonth = oneMonthResult.value;
    const points = mergeHistory(
      existingHistory?.points || [],
      [...oneMonth.traffic, ...(twoDaysResult.status === 'fulfilled' ? twoDaysResult.value.traffic : [])],
    );
    const dailyPeaks = buildDailyPeaks(points);
    const monthPeak = peakOf(points);

    output.decixHistory = {
      updated: new Date().toISOString(),
      source: 'DE-CIX FRA',
      start: new Date(MONTH_START).toISOString(),
      points,
      dailyPeaks,
      monthPeak: monthPeak.value || null,
      monthPeakAt: monthPeak.clock,
    };
    output.sources.decixHistory = 'ok';

    if (output.decix) {
      output.decix.meta.monthPeak = output.decixHistory.monthPeak;
      output.decix.meta.monthPeakAt = output.decixHistory.monthPeakAt;
    }
  } else {
    output.sources.decixHistory = existingHistory ? 'degraded' : 'missing';
    output.decixHistoryError =
      oneMonthResult.reason?.message || 'DE-CIX 1month failed';
  }

  output.decixSites = await collectDecixSites(existingSites).catch((error) => {
    output.decixSitesError = error.message;
    return existingSites;
  });
  const siteStates = Object.values(output.decixSites?.sites || {}).map((site) => site.status);
  output.sources.decixSites = siteStates.length && siteStates.every((state) => state === 'ok') ? 'ok' : 'degraded';
  const siteErrors = Object.values(output.decixSites?.sites || {})
    .filter((site) => site.error)
    .map((site) => `${site.key}: ${site.error}`);
  if (siteErrors.length) output.decixSitesError = siteErrors.join('; ');

  output.sources.rockstar = output.rockstar?.ok ? 'ok' : 'degraded';
  output.sources.preload = output.preload ? 'ok' : 'degraded';

  await sleep(100);

  return output;
}
