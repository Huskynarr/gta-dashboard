import {
  fetchJson,
  isoDay,
  round,
  sleep,
} from './http.mjs';

export const STOCK_UNIVERSE = [
  {
    symbol: 'TTWO',
    yahoo: 'TTWO',
    name: 'Take-Two Interactive',
    group: 'gaming',
    role: 'GTA VI Publisher',
    color: '#ff2e88',
  },
  {
    symbol: 'RBLX',
    yahoo: 'RBLX',
    name: 'Roblox',
    group: 'gaming',
    role: 'Platform · UGC',
    color: '#ff7a18',
  },
  {
    symbol: 'CDR',
    yahoo: 'CDR.WA',
    name: 'CD Projekt',
    group: 'gaming',
    role: 'Publisher · Polen',
    color: '#ffc857',
  },
  {
    symbol: 'UBI',
    yahoo: 'UBI.PA',
    name: 'Ubisoft',
    group: 'gaming',
    role: 'Publisher · Frankreich',
    color: '#9b5cff',
  },
  {
    symbol: '7974',
    yahoo: '7974.T',
    name: 'Nintendo',
    group: 'gaming',
    role: 'Platform · Japan',
    color: '#ff4d4d',
  },
  {
    symbol: 'SONY',
    yahoo: 'SONY',
    name: 'Sony',
    group: 'platform',
    role: 'PlayStation',
    color: '#21e6c1',
  },
  {
    symbol: 'MSFT',
    yahoo: 'MSFT',
    name: 'Microsoft',
    group: 'platform',
    role: 'Xbox · Cloud',
    color: '#4da3ff',
  },
  {
    symbol: 'NVDA',
    yahoo: 'NVDA',
    name: 'NVIDIA',
    group: 'platform',
    role: 'GPU · AI',
    color: '#7ef29d',
  },
  {
    symbol: 'UBER',
    yahoo: 'UBER',
    name: 'Uber',
    group: 'delivery',
    role: 'Uber Eats',
    color: '#21e6c1',
  },
  {
    symbol: 'DASH',
    yahoo: 'DASH',
    name: 'DoorDash',
    group: 'delivery',
    role: 'Delivery',
    color: '#ff5c5c',
  },
  {
    symbol: 'DHER',
    yahoo: 'DHER.DE',
    name: 'Delivery Hero',
    group: 'delivery',
    role: 'Delivery · Deutschland',
    color: '#ff2e88',
  },
  {
    symbol: 'GME',
    yahoo: 'GME',
    name: 'GameStop',
    group: 'retail',
    role: 'Retail · Meme',
    color: '#ffc857',
  },
  {
    symbol: 'AMZN',
    yahoo: 'AMZN',
    name: 'Amazon',
    group: 'platform',
    role: 'Cloud · Retail',
    color: '#ff9900',
  },
];

function mergeHistory(oldHistory = [], newHistory = []) {
  const byDate = new Map();

  for (const point of oldHistory) {
    if (point?.date) byDate.set(point.date, point);
  }
  for (const point of newHistory) {
    if (point?.date) byDate.set(point.date, point);
  }

  return [...byDate.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-400);
}

async function fetchYahooSeries(stock) {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(stock.yahoo)}` +
    '?range=1y&interval=1d&includePrePost=false&events=div%2Csplits';

  const json = await fetchJson(url, {
    headers: { Accept: 'application/json' },
  });

  const result = json?.chart?.result?.[0];
  if (!result) {
    const description = json?.chart?.error?.description || 'no chart result';
    throw new Error(description);
  }

  const meta = result.meta || {};
  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0] || {};
  const history = [];

  for (let i = 0; i < timestamps.length; i += 1) {
    const close = quote.close?.[i];
    if (close == null || !Number.isFinite(close)) continue;

    history.push({
      date: isoDay(new Date(timestamps[i] * 1000)),
      open: round(quote.open?.[i], 4),
      high: round(quote.high?.[i], 4),
      low: round(quote.low?.[i], 4),
      close: round(close, 4),
      volume: quote.volume?.[i] ?? null,
    });
  }

  const latest = history.at(-1);
  const previous = history.at(-2);
  const price = meta.regularMarketPrice ?? latest?.close ?? null;
  const previousClose =
    meta.chartPreviousClose ?? meta.previousClose ?? previous?.close ?? null;
  const lows = history.map((point) => point.low).filter(Number.isFinite);
  const highs = history.map((point) => point.high).filter(Number.isFinite);
  const fiftyTwoWeekLow =
    meta.fiftyTwoWeekLow > 0 ? meta.fiftyTwoWeekLow : Math.min(...lows);
  const fiftyTwoWeekHigh =
    meta.fiftyTwoWeekHigh > 0 ? meta.fiftyTwoWeekHigh : Math.max(...highs);

  let changePct = null;
  if (Number.isFinite(Number(meta.regularMarketChangePercent))) {
    changePct = Number(meta.regularMarketChangePercent);
  } else if (price != null && previousClose) {
    changePct = ((price - previousClose) / previousClose) * 100;
  }

  return {
    ...stock,
    currency: meta.currency || 'USD',
    exchange: meta.fullExchangeName || meta.exchangeName || '',
    price: round(price, 4),
    previousClose: round(previousClose, 4),
    changePct: round(changePct, 2),
    marketTime: meta.regularMarketTime
      ? new Date(meta.regularMarketTime * 1000).toISOString()
      : null,
    dayHigh: round(meta.regularMarketDayHigh > 0 ? meta.regularMarketDayHigh : latest?.high, 4),
    dayLow: round(meta.regularMarketDayLow > 0 ? meta.regularMarketDayLow : latest?.low, 4),
    fiftyTwoWeekHigh: round(fiftyTwoWeekHigh, 4),
    fiftyTwoWeekLow: round(fiftyTwoWeekLow, 4),
    volume:
      meta.regularMarketVolume > 0
        ? meta.regularMarketVolume
        : latest?.volume ?? null,
    history,
  };
}

export async function collectStocks(existing = null) {
  const output = {
    updated: new Date().toISOString(),
    source: 'Yahoo Finance chart API',
    series: {},
    snapshots: Array.isArray(existing?.snapshots) ? existing.snapshots : [],
  };

  const errors = [];

  for (const stock of STOCK_UNIVERSE) {
    try {
      const fresh = await fetchYahooSeries(stock);
      const old = existing?.series?.[stock.symbol];
      fresh.history = mergeHistory(old?.history || [], fresh.history);
      output.series[stock.symbol] = fresh;
    } catch (error) {
      errors.push(`${stock.symbol}: ${error.message}`);
      const old = existing?.series?.[stock.symbol];
      output.series[stock.symbol] = old
        ? old
        : { ...stock, error: error.message, history: [] };
    }

    await sleep(220);
  }

  const now = new Date();
  const slot = now.getUTCHours() < 12 ? 'morning' : 'evening';
  const date = isoDay(now);
  const snapshot = {
    ts: now.toISOString(),
    date,
    slot,
    prices: {},
  };

  for (const [symbol, stock] of Object.entries(output.series)) {
    if (stock.price != null) {
      snapshot.prices[symbol] = {
        price: stock.price,
        changePct: stock.changePct,
      };
    }
  }

  output.slot = slot;
  // One snapshot per UTC hour (hourly runs during the release window), never
  // overwriting earlier hours so the full November → December record is kept.
  const hour = snapshot.ts.slice(0, 13);
  output.snapshots = output.snapshots
    .filter((entry) => String(entry.ts || '').slice(0, 13) !== hour)
    .concat(snapshot)
    .slice(-5000);

  output.errors = errors;

  return output;
}
