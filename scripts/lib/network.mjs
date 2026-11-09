import { fetchJson, sleep } from './http.mjs';

const DECIX_HEADERS = {
  Accept: 'application/json, text/javascript, */*; q=0.01',
  Referer: 'https://www.de-cix.net/en/locations/frankfurt/statistics',
  'X-Requested-With': 'XMLHttpRequest',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
};

const MONTH_START = Date.UTC(2026, 10, 1); // 1. November 2026
const HISTORY_LIMIT = 20000;

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

async function fetchDecix(range) {
  const json = await fetchJson(
    `https://www.de-cix.net/api/traffic/FRA/${range}`,
    { headers: DECIX_HEADERS },
    30000,
  );

  return {
    meta: normalizeMeta(json.meta),
    traffic: normalizeTraffic(json.traffic),
  };
}

function mergeHistory(existingPoints = [], newPoints = []) {
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

function buildDailyPeaks(points) {
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

export async function collectNetwork(
  existing = null,
  osint = null,
  existingHistory = null,
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
    const monthPeak = points.reduce(
      (best, [clock, value]) =>
        value > best.value ? { value, clock } : best,
      { value: 0, clock: null },
    );

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

  output.sources.rockstar = output.rockstar?.ok ? 'ok' : 'degraded';
  output.sources.preload = output.preload ? 'ok' : 'degraded';

  await sleep(100);

  return output;
}
