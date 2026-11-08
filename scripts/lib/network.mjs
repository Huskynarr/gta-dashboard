import { fetchJson, sleep } from './http.mjs';

const DECIX_HEADERS = {
  Accept: 'application/json, text/javascript, */*; q=0.01',
  Referer: 'https://www.de-cix.net/en/locations/frankfurt/statistics',
  'X-Requested-With': 'XMLHttpRequest',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
};

function normalizeMeta(meta = {}) {
  return {
    allTimePeak: meta['all-time-peak'] ?? null,
    current: meta.current ?? null,
    graphAverage: meta['graph-average'] ?? null,
    graphPeak: meta['graph-peak'] ?? null,
  };
}

async function fetchDecix(range) {
  const json = await fetchJson(
    `https://www.de-cix.net/api/traffic/FRA/${range}`,
    { headers: DECIX_HEADERS },
    30000,
  );

  return {
    meta: normalizeMeta(json.meta),
    traffic: (json.traffic || []).map((point) => ({
      clock: point.clock,
      value: point.value,
    })),
  };
}

export async function collectNetwork(existing = null, osint = null) {
  const output = {
    updated: new Date().toISOString(),
    decix: existing?.decix || null,
    rockstar: osint?.rockstar || existing?.rockstar || null,
    preload: osint?.preload || existing?.preload || null,
    sources: {},
  };

  try {
    const twoDays = await fetchDecix('2days');

    output.decix = {
      fetchedAt: new Date().toISOString(),
      meta: {
        ...twoDays.meta,
        allTimePeakDate: '2026-10-14',
      },
      traffic2d: twoDays.traffic,
    };
    output.sources.decix = 'ok';
  } catch (error) {
    output.sources.decix = 'degraded';
    output.decixError = error.message;
  }

  output.sources.rockstar = output.rockstar?.ok ? 'ok' : 'degraded';
  output.sources.preload = output.preload ? 'ok' : 'degraded';

  await sleep(100);

  return output;
}
