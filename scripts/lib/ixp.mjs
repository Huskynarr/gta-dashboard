import { fetchJson, fetchText, sleep } from './http.mjs';
import { MONTH_START, buildDailyPeaks, mergeHistory } from './network.mjs';

// Internet exchanges besides DE-CIX that publish machine-readable traffic.
// Both have a coarser history (AMS-IX: 2 h, LONAP: up to 30 min) next to
// their 5-minute window, which backfills 1 November on the first run and
// closes gaps after collector outages.
export const IXP_SITES = [
  { key: 'AMS', label: 'Amsterdam (AMS-IX)', operator: 'AMS-IX', timeZone: 'Europe/Amsterdam' },
  { key: 'LON', label: 'London (LONAP)', operator: 'LONAP', timeZone: 'Europe/London' },
];

const STEP = 300; // seconds; drops LONAP's unaligned "now" sample

/**
 * Coarse points only where no finer data exists: before the stored history,
 * or in a gap between the stored history and the current 5-minute window.
 */
export function fillGaps(existingPoints = [], coarse = [], fine = []) {
  const firstExisting = existingPoints[0]?.[0] ?? Infinity;
  const lastExisting = existingPoints.at(-1)?.[0] ?? -Infinity;
  const firstFine = fine[0]?.clock ?? Infinity;
  return coarse.filter(
    (point) =>
      point.clock < Math.min(firstExisting, firstFine) ||
      (point.clock > lastExisting && point.clock < firstFine),
  );
}

/** AMS-IX statistics page embeds its Apollo GraphQL cache; values are Mbit/s. */
export function parseAmsix(html) {
  const marker = 'window.__APOLLO_STATE__ = ';
  const start = html.indexOf(marker);
  if (start < 0) throw new Error('AMS-IX: __APOLLO_STATE__ not found');
  const state = JSON.parse(extractJson(html, start + marker.length));

  const graphs = {};
  for (const value of Object.values(state)) {
    if (value?.__typename !== 'graph_Entry' || !value.interval) continue;
    graphs[value.interval] = {
      peak: Number(value.peakIn) * 1e6,
      current: Number(value.currentIn) * 1e6,
      points: (value.averageInputData || [])
        .map((ref) => state[ref.id])
        .filter((row) => Number.isFinite(row?.time) && Number.isFinite(row?.value))
        .map((row) => ({ clock: row.time * 1000, value: Math.round(row.value * 1e6) })),
    };
  }
  if (!graphs.daily?.points.length) throw new Error('AMS-IX: daily traffic graph missing');
  return graphs;
}

function extractJson(text, from) {
  // Balanced-brace scan; the state object is followed by more inline script.
  let depth = 0;
  let inString = false;
  for (let i = from; i < text.length; i += 1) {
    const char = text[i];
    if (inString) {
      if (char === '\\') i += 1;
      else if (char === '"') inString = false;
    } else if (char === '"') inString = true;
    else if (char === '{') depth += 1;
    else if (char === '}' && (depth -= 1) === 0) return text.slice(from, i + 1);
  }
  throw new Error('AMS-IX: unterminated state object');
}

async function fetchAmsix() {
  const html = await fetchText('https://www.ams-ix.net/ams/documentation/total-stats', {
    headers: { Accept: 'text/html,application/xhtml+xml' },
  }, 30000);
  const graphs = parseAmsix(html);
  return {
    fine: graphs.daily.points,
    coarse: graphs.monthly?.points || [],
    meta: {
      current: graphs.daily.current,
      peak: Math.max(graphs.yearly?.peak || 0, graphs.monthly?.peak || 0, graphs.daily.peak || 0),
    },
  };
}

/** IXP Manager grapher log rows: [unix, avgIn, avgOut, maxIn, maxOut] in bit/s. */
export function parseIxpManagerLog(rows = []) {
  return rows
    .filter((row) => Array.isArray(row) && row[0] % STEP === 0 && Number.isFinite(row[1]))
    .map((row) => ({ clock: row[0] * 1000, value: row[1] }))
    .sort((a, b) => a.clock - b.clock);
}

async function fetchLonap() {
  const base = 'https://portal.lonap.net/grapher/ixp?category=bits&protocol=all&id=1';
  const headers = { headers: { Accept: 'application/json' } };
  const day = await fetchJson(`${base}&period=day&type=log`, headers);
  const month = await fetchJson(`${base}&period=month&type=log`, headers);
  const year = await fetchJson(`${base}&period=year&type=json`, headers);
  return {
    fine: parseIxpManagerLog(day),
    coarse: parseIxpManagerLog(month),
    meta: {
      current: year?.statistics?.curin ?? null,
      peak: year?.statistics?.maxin ?? null,
    },
  };
}

const FETCHERS = { AMS: fetchAmsix, LON: fetchLonap };

async function collectIxp(site, existing = null) {
  try {
    const data = await FETCHERS[site.key]();
    const previous = existing?.points || [];
    const fresh = [...fillGaps(previous, data.coarse, data.fine), ...data.fine]
      .filter((point) => point.clock >= MONTH_START);
    const points = mergeHistory(previous, fresh);
    const peak = points.reduce((best, [clock, value]) => (value > best.value ? { value, clock } : best), { value: 0, clock: null });
    return {
      ...site,
      status: 'ok',
      fetchedAt: new Date().toISOString(),
      // No published all-time peak: the 12-month peak is the 100 % reference.
      meta: { current: data.meta.current, allTimePeak: data.meta.peak || peak.value || null, peakBasis: '12 months' },
      monthPeak: peak.value || null,
      monthPeakAt: peak.clock,
      points,
      dailyPeaks: buildDailyPeaks(points),
    };
  } catch (error) {
    return {
      ...(existing || { ...site, points: [] }),
      ...site,
      status: existing?.points?.length ? 'degraded' : 'missing',
      error: error.message,
    };
  }
}

export async function collectIxpSites(existing = null) {
  const sites = {};
  for (const site of IXP_SITES) {
    sites[site.key] = await collectIxp(site, existing?.sites?.[site.key]);
    await sleep(250);
  }
  return {
    updated: new Date().toISOString(),
    source: 'AMS-IX statistics page, LONAP IXP Manager grapher',
    start: new Date(MONTH_START).toISOString(),
    sites,
  };
}
