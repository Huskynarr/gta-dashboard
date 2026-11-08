import { createBarChart, createGauge, createLineChart, sparkline } from './charts.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const FALLBACK_RELEASE = {
  preorder: '2026-06-25T00:00:00+02:00',
  ps5Preload: '2026-11-10T00:00:00+01:00',
  xboxPreload: '2026-11-10T00:00:00Z',
  physical: '2026-11-12T00:00:00+01:00',
  release: '2026-11-19T00:00:00+01:00',
  storageGB: 212,
};

const BASKETS = [
  {
    key: 'gta',
    label: 'GTA VI Basket',
    desc: 'Publisher · Plattform · GPU',
    symbols: ['TTWO', 'RBLX', 'CDR', 'UBI', '7974', 'SONY', 'MSFT', 'NVDA'],
    color: '#ff2e88',
  },
  {
    key: 'delivery',
    label: 'Delivery Basket',
    desc: 'Uber Eats · DoorDash · Delivery Hero',
    symbols: ['UBER', 'DASH', 'DHER'],
    color: '#21e6c1',
  },
  {
    key: 'retail',
    label: 'Retail / Meme',
    desc: 'GameStop · Amazon',
    symbols: ['GME', 'AMZN'],
    color: '#ffc857',
  },
];

const TIMELINE_EVENTS = [
  {
    date: '2023-12-04',
    tag: 'Trailer 1',
    title: 'Der erste Blick auf Leonida',
    text: 'Rockstar zeigt den ersten GTA-VI-Trailer. Innerhalb von 24 Stunden bricht er Rekorde und setzt die Erwartungen für Jahre.',
  },
  {
    date: '2024-05-16',
    tag: 'Prognose',
    title: 'Take-Two bestätigt Fall 2025',
    text: 'Der Release wird offiziell für Herbst 2025 angekündigt. Der Markt beginnt, den Termin einzupreisen.',
  },
  {
    date: '2025-05-02',
    tag: 'Delay 1',
    title: 'Verschiebung auf Mai 2026',
    text: 'Rockstar verschiebt den Release. Die Aktie reagiert, die Community diskutiert — und der Hype bleibt.',
  },
  {
    date: '2025-11-06',
    tag: 'Delay 2',
    title: 'Neuer Termin: 19. November 2026',
    text: 'Die zweite Verschiebung setzt den finalen Release-Termin. Preload und Marketing laufen auf diesen Tag zu.',
  },
  {
    date: '2026-06-25',
    tag: 'Preorder',
    title: 'Vorbestellungen öffnen',
    text: 'Pre-Orders starten weltweit. Standard Edition für 79,99 $, Ultimate Edition für 99,99 $ — inklusive Vintage Vice City Pack.',
  },
  {
    date: '2026-11-10',
    tag: 'Preload',
    title: '212 GB gehen auf die Reise',
    text: 'PS5-Preload startet um 00:00 lokal, Xbox weltweit um 00:00 GMT. Der DE-CIX und die CDNs werden es merken.',
  },
  {
    date: '2026-11-12',
    tag: 'Physical',
    title: 'Code-in-Box im Handel',
    text: 'Die physische Version mit Download-Code kommt in den Handel. Preload ist damit auch ohne digitale Vorbestellung möglich.',
  },
  {
    date: '2026-11-19',
    tag: 'Release',
    title: 'Willkommen in Vice City',
    text: 'GTA VI erscheint um Mitternacht lokal. Der Moment, auf den der Markt, die Netzwerke und dieses Dashboard gewartet haben.',
  },
];

const SOURCE_LABELS = {
  stocks: 'Aktien · Yahoo Finance',
  osint: 'OSINT · Wikipedia / News / Reddit / Steam / Trends',
  network: 'Netzwerk · DE-CIX Frankfurt',
  reddit: 'Reddit · Arctic Shift',
  steam: 'Steam · GTA V',
  trends: 'Google Trends · DE/US',
  rockstar: 'Rockstar · Endpoint-Probe',
  decix: 'DE-CIX · Traffic-API',
  playstation: 'PlayStation · Preload-Seite',
};

const state = {
  stocks: null,
  osint: null,
  network: null,
  meta: null,
  marketRange: 90,
  wikiRange: 90,
  group: 'all',
};

const intFmt = new Intl.NumberFormat('de-DE');
const compactFmt = new Intl.NumberFormat('de-DE', {
  maximumFractionDigits: 1,
});
const pctFmt = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const dateShortFmt = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'short' });
const dateLongFmt = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function average(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return null;
  return clean.reduce((total, value) => total + value, 0) / clean.length;
}

function pct(value, digits = 2) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  const number = Number(value);
  return `${number > 0 ? '+' : ''}${number.toFixed(digits).replace('.', ',')} %`;
}

function money(value, currency = 'USD') {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  try {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(Number(value));
  } catch {
    return `${Number(value).toFixed(2)} ${currency}`;
  }
}

function compact(value) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  const number = Number(value);
  const abs = Math.abs(number);
  if (abs >= 1e9) return `${compactFmt.format(number / 1e9)} Mrd.`;
  if (abs >= 1e6) return `${compactFmt.format(number / 1e6)} Mio.`;
  if (abs >= 1e3) return `${compactFmt.format(number / 1e3)} Tsd.`;
  return compactFmt.format(number);
}

function tbit(value) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  return `${(Number(value) / 1e12).toFixed(2).replace('.', ',')} Tbit/s`;
}

function dateShort(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return dateShortFmt.format(date);
}

function dateLong(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return dateLongFmt.format(date);
}

function relative(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diff = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diff);
  const formatter = new Intl.RelativeTimeFormat('de', { numeric: 'auto' });
  if (abs < 60) return formatter.format(diff, 'second');
  if (abs < 3600) return formatter.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return formatter.format(Math.round(diff / 3600), 'hour');
  if (abs < 86400 * 30) return formatter.format(Math.round(diff / 86400), 'day');
  return formatter.format(Math.round(diff / (86400 * 30)), 'month');
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function changeClass(value) {
  if (value == null || !Number.isFinite(Number(value))) return 'is-flat';
  if (Number(value) > 0.005) return 'is-up';
  if (Number(value) < -0.005) return 'is-down';
  return 'is-flat';
}

function history(stock) {
  return (stock?.history || [])
    .filter((point) => Number.isFinite(point.close))
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
}

function sliceDays(series, days) {
  if (!series.length) return [];
  const latest = new Date(`${series.at(-1).date}T12:00:00Z`);
  const cutoff = new Date(latest);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const cutoffString = cutoff.toISOString().slice(0, 10);
  return series.filter((point) => point.date >= cutoffString);
}

function changeOver(series, days) {
  const sliced = sliceDays(series, days);
  if (sliced.length < 2) return null;
  return ((sliced.at(-1).close - sliced[0].close) / sliced[0].close) * 100;
}

function changeSince(stock, dateString) {
  const series = history(stock);
  const start = series.find((point) => point.date >= dateString);
  const end = series.at(-1);
  if (!start || !end || start.date === end.date) return null;
  return ((end.close - start.close) / start.close) * 100;
}

function computeBasket(seriesMap, symbols, days) {
  const maps = symbols
    .map((symbol) => seriesMap[symbol])
    .filter(Boolean)
    .map((stock) => new Map(history(stock).map((point) => [point.date, point.close])));

  if (!maps.length) return [];

  const dates = [...new Set(maps.flatMap((map) => [...map.keys()]))].sort();
  if (!dates.length) return [];

  const latest = new Date(`${dates.at(-1)}T12:00:00Z`);
  const cutoff = new Date(latest);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const cutoffString = cutoff.toISOString().slice(0, 10);
  const selected = dates.filter((date) => date >= cutoffString);

  let value = 100;
  let previous = null;
  const output = [];

  for (const date of selected) {
    if (previous) {
      const returns = [];
      for (const map of maps) {
        const before = map.get(previous);
        const after = map.get(date);
        if (before && after) returns.push(after / before - 1);
      }
      if (returns.length) {
        value *= 1 + returns.reduce((total, item) => total + item, 0) / returns.length;
      }
    }
    output.push({ date, value });
    previous = date;
  }

  return output;
}

function basketStats(basket) {
  const series = computeBasket(state.stocks?.series || {}, basket.symbols, 30);
  const latest = series.at(-1)?.value ?? null;
  const first = series[0]?.value ?? null;
  return {
    series,
    value: latest,
    change: latest != null && first ? latest - first : null,
  };
}

function computeHypeScore() {
  const osint = state.osint;
  if (!osint) return null;

  const wikiEn = osint.wikipedia?.gta_en;
  const wikiDe = osint.wikipedia?.gta_de;
  const newsEn = osint.news?.gta_en;
  const reddit = osint.reddit;

  const ratios = [];
  for (const wiki of [wikiEn, wikiDe]) {
    if (wiki?.recent7 > 0 && wiki?.prev7 > 0) ratios.push(wiki.recent7 / wiki.prev7);
  }
  const wikiRatio = average(ratios);
  const wikiScore = wikiRatio == null ? null : clamp(50 + (wikiRatio - 1) * 42, 0, 100);

  const newsBase = newsEn?.count7d > 0 ? newsEn.count7d / 7 : null;
  const newsRatio = newsBase ? (newsEn.count24h + 0.6) / (newsBase + 0.6) : null;
  const newsScore = newsRatio == null ? null : clamp(50 + (newsRatio - 1) * 42, 0, 100);

  const postsPerHour = reddit?.postsPerHour;
  const redditScore = postsPerHour == null ? null : clamp(postsPerHour * 3.2, 0, 100);

  const parts = [
    [wikiScore, 0.45],
    [newsScore, 0.35],
    [redditScore, 0.2],
  ].filter(([value]) => value != null);

  if (!parts.length) return null;
  const totalWeight = parts.reduce((total, [, weight]) => total + weight, 0);
  return Math.round(parts.reduce((total, [value, weight]) => total + value * weight, 0) / totalWeight);
}

function computeSickSignal() {
  const osint = state.osint;
  if (!osint) return null;

  const wikiRatios = [];
  for (const key of ['sick_stand', 'sick_ability']) {
    const wiki = osint.wikipedia?.[key];
    if (wiki?.recent7 > 0 && wiki?.prev7 > 0) wikiRatios.push(wiki.recent7 / wiki.prev7);
  }
  const wikiRatio = average(wikiRatios);
  const wikiScore = wikiRatio == null ? null : clamp(50 + (wikiRatio - 1) * 55, 0, 100);

  const news = osint.news?.sick_de;
  const newsBase = news?.count7d > 0 ? news.count7d / 7 : null;
  const newsRatio = newsBase ? (news.count24h + 0.5) / (newsBase + 0.5) : null;
  const newsScore = newsRatio == null ? null : clamp(50 + (newsRatio - 1) * 45, 0, 100);

  const parts = [
    [wikiScore, 0.65],
    [newsScore, 0.35],
  ].filter(([value]) => value != null);

  if (!parts.length) return null;
  const totalWeight = parts.reduce((total, [, weight]) => total + weight, 0);
  return Math.round(parts.reduce((total, [value, weight]) => total + value * weight, 0) / totalWeight);
}

async function loadData() {
  const files = ['stocks', 'osint', 'network', 'meta'];
  const results = await Promise.all(
    files.map(async (name) => {
      try {
        const response = await fetch(`./data/${name}.json`, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } catch (error) {
        console.warn(`data/${name}.json konnte nicht geladen werden`, error);
        return null;
      }
    }),
  );

  [state.stocks, state.osint, state.network, state.meta] = results;
  if (!state.stocks || !state.osint) {
    const banner = document.createElement('div');
    banner.className = 'data-banner';
    banner.textContent =
      'Einige Datenquellen sind gerade nicht erreichbar. Die letzte erfolgreiche Momentaufnahme bleibt sichtbar.';
    $('#main')?.prepend(banner);
  }
}

function renderCountdown() {
  const release = state.meta?.release || FALLBACK_RELEASE;
  const now = Date.now();
  const preloadTime = new Date(release.ps5Preload || FALLBACK_RELEASE.ps5Preload).getTime();
  const releaseTime = new Date(release.release || FALLBACK_RELEASE.release).getTime();
  const isPreload = now < preloadTime;
  const target = isPreload ? preloadTime : releaseTime;
  const diff = Math.max(target - now, 0);

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000) % 24;
  const minutes = Math.floor(diff / 60000) % 60;
  const seconds = Math.floor(diff / 1000) % 60;

  $('#cdDays').textContent = String(days).padStart(2, '0');
  $('#cdHours').textContent = String(hours).padStart(2, '0');
  $('#cdMinutes').textContent = String(minutes).padStart(2, '0');
  $('#cdSeconds').textContent = String(seconds).padStart(2, '0');

  if (now >= releaseTime) {
    $('#cdLabel').textContent = 'JETZT IN LEONIDA';
    $('#cdTarget').textContent = 'Released · 19. November 2026';
  } else if (isPreload) {
    $('#cdLabel').textContent = 'PRELOAD STARTET IN';
    $('#cdTarget').textContent = '10. November 2026 · 00:00 CET · 212 GB';
  } else {
    $('#cdLabel').textContent = 'RELEASE STARTET IN';
    $('#cdTarget').textContent = '19. November 2026 · 00:00 CET';
  }
}

function renderTicker() {
  const track = $('#tickerTrack');
  if (!track) return;
  const stocks = Object.values(state.stocks?.series || {});
  if (!stocks.length) {
    track.innerHTML = '<span class="ticker__item"><strong>DATA FEED</strong><em>offline</em></span>';
    return;
  }

  const items = stocks
    .map((stock) => {
      const cls = changeClass(stock.changePct);
      return `<span class="ticker__item"><strong>${escapeHtml(stock.symbol)}</strong><em>${money(stock.price, stock.currency)}</em><span class="${cls}">${pct(stock.changePct)}</span></span>`;
    })
    .join('');
  track.innerHTML = items + items;
  track.style.animationDuration = `${Math.max(34, stocks.length * 5)}s`;
}

function renderHero() {
  const stocks = state.stocks?.series || {};
  const ttwo = stocks.TTWO;
  const basket = basketStats(BASKETS[0]);
  const decix = state.network?.decix?.meta?.current;
  const hype = computeHypeScore();

  $('#heroTtwo').textContent = ttwo ? money(ttwo.price, ttwo.currency) : '—';
  $('#heroTtwoSub').textContent = ttwo
    ? `${pct(ttwo.changePct)} · ${ttwo.exchange || 'NASDAQ'}`
    : 'Take-Two Interactive';
  $('#heroBasket').textContent = basket.value != null ? basket.value.toFixed(1).replace('.', ',') : '—';
  $('#heroBasket').nextElementSibling.textContent =
    basket.change != null ? `${pct(basket.change)} · 30 Tage` : 'Equal-Weight · 90 Tage';
  $('#heroDecix').textContent = decix ? tbit(decix) : '—';
  $('#heroHype').textContent = hype != null ? `${hype}/100` : '—';
}

function renderBaskets() {
  const grid = $('#basketCards');
  if (!grid) return;
  const seriesMap = state.stocks?.series || {};

  if (!Object.keys(seriesMap).length) {
    grid.innerHTML = '<div class="panel"><p class="chart__empty">Aktien-Feed nicht verfügbar.</p></div>';
    return;
  }

  grid.innerHTML = BASKETS.map((basket) => {
    const stats = basketStats(basket);
    const spark = sparkline(stats.series.map((point) => point.value), basket.color);
    const cls = changeClass(stats.change);
    return `<article class="basket-card">
      <div class="basket-card__top"><span class="basket-card__label">${escapeHtml(basket.label)}</span><span class="basket-card__change ${cls}">${pct(stats.change)}</span></div>
      <div class="basket-card__value"><strong>${stats.value != null ? stats.value.toFixed(1).replace('.', ',') : '—'}</strong><span>Base 100 · 30T</span></div>
      <p class="basket-card__desc">${escapeHtml(basket.desc)}</p>
      <div class="basket-card__spark">${spark}</div>
    </article>`;
  }).join('');

  const chartSeries = BASKETS.map((basket) => ({
    label: basket.label,
    color: basket.color,
    data: computeBasket(seriesMap, basket.symbols, state.marketRange).map((point) => ({
      x: point.date,
      y: point.value,
    })),
  }));

  createLineChart($('#basketChart'), chartSeries, {
    height: 340,
    area: true,
    valueFormat: (value) => value.toFixed(1).replace('.', ','),
    yFormat: (value) => value.toFixed(0),
    xFormat: (time) => dateShort(time),
    ariaLabel: 'Equal-Weight-Baskets im Zeitverlauf',
    referenceLines: [{ value: 100, label: 'BASE 100', color: 'rgba(255,255,255,0.22)' }],
  });

  const legend = $('#basketLegend');
  if (legend) {
    legend.innerHTML = chartSeries.map((entry) => {
      const latest = entry.data.at(-1)?.y;
      return `<span class="chart__legend-item" style="color:${entry.color}"><i class="chart__legend-swatch" style="background:${entry.color}"></i>${escapeHtml(entry.label)} <strong>${latest != null ? latest.toFixed(1).replace('.', ',') : '—'}</strong></span>`;
    }).join('');
  }
}

function renderStocks() {
  const grid = $('#stockGrid');
  if (!grid) return;
  const seriesMap = state.stocks?.series || {};
  const order = ['TTWO', 'RBLX', 'CDR', 'UBI', '7974', 'SONY', 'MSFT', 'NVDA', 'UBER', 'DASH', 'DHER', 'GME', 'AMZN'];
  const stocks = Object.values(seriesMap)
    .filter((stock) => state.group === 'all' || stock.group === state.group)
    .sort((a, b) => {
      const ai = order.indexOf(a.symbol);
      const bi = order.indexOf(b.symbol);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  if (!stocks.length) {
    grid.innerHTML = '<div class="panel"><p class="chart__empty">Keine Aktien in dieser Gruppe.</p></div>';
    return;
  }

  grid.innerHTML = stocks.map((stock) => {
    const points = sliceDays(history(stock), state.marketRange);
    const spark = sparkline(points.map((point) => point.close), stock.color);
    const change30 = changeOver(history(stock), 30);
    const sincePreorder = changeSince(stock, state.meta?.release?.preorder || FALLBACK_RELEASE.preorder);
    const low = stock.fiftyTwoWeekLow;
    const high = stock.fiftyTwoWeekHigh;
    const rangePosition =
      low != null && high != null && high > low
        ? clamp(((stock.price - low) / (high - low)) * 100, 0, 100)
        : 50;
    const cls = changeClass(stock.changePct);
    const error = stock.error ? `<span class="badge is-degraded">degraded</span>` : '';

    return `<article class="stock-card" data-group="${escapeHtml(stock.group || 'other')}">
      <div class="stock-card__top">
        <div><span class="stock-card__symbol">${escapeHtml(stock.symbol)}</span><span class="stock-card__name">${escapeHtml(stock.name)}</span><span class="stock-card__role">${escapeHtml(stock.role || stock.group || '')}</span></div>
        ${error || `<span class="badge">${escapeHtml((stock.group || 'other').toUpperCase())}</span>`}
      </div>
      <div class="stock-card__price">${money(stock.price, stock.currency)}</div>
      <span class="stock-card__change ${cls}">${pct(stock.changePct)}</span>
      <div class="stock-card__spark">${spark}</div>
      <div class="stock-card__meta"><span>30T ${pct(change30)}</span><span>Vol. ${compact(stock.volume)}</span></div>
      <div class="stock-card__range" title="52-Wochen-Range"><div class="stock-card__range-fill" style="width:${rangePosition.toFixed(1)}%"></div><div class="stock-card__range-dot" style="left:${rangePosition.toFixed(1)}%"></div></div>
      <div class="stock-card__footer"><span>52W ${low != null ? money(low, stock.currency) : '—'} – ${high != null ? money(high, stock.currency) : '—'}</span><span>Preorder ${pct(sincePreorder)}</span></div>
    </article>`;
  }).join('');
}

function renderSick() {
  const osint = state.osint;
  const score = computeSickSignal();
  const gaugeColor = score == null ? '#21e6c1' : score >= 70 ? '#ff2e88' : score >= 40 ? '#ffc857' : '#21e6c1';
  createGauge($('#sickGauge'), score ?? 0, { label: 'SICK LEAVE', color: gaugeColor });

  const caption = $('#sickGaugeCaption');
  if (caption) {
    if (score == null) caption.textContent = 'Noch nicht genug Daten für ein Signal.';
    else if (score >= 70) caption.textContent = 'Erhöhtes Signal: Suchvolumen und News liegen deutlich über dem 7-Tage-Schnitt.';
    else if (score >= 40) caption.textContent = 'Leicht erhöht: erste Vorzeichen über dem 7-Tage-Schnitt.';
    else caption.textContent = 'Unauffällig: kein erhöhtes Signal gegenüber dem 7-Tage-Schnitt.';
  }

  const stand = osint?.wikipedia?.sick_stand;
  const ability = osint?.wikipedia?.sick_ability;
  const news = osint?.news?.sick_de;

  const series = [
    {
      label: 'Krankenstand',
      color: '#ff2e88',
      data: (stand?.series || []).slice(-90).map((point) => ({ x: point.date, y: point.views })),
    },
    {
      label: 'Arbeitsunfähigkeit',
      color: '#ffc857',
      data: (ability?.series || []).slice(-90).map((point) => ({ x: point.date, y: point.views })),
    },
  ];

  createLineChart($('#sickChart'), series, {
    height: 300,
    area: true,
    valueFormat: (value) => intFmt.format(Math.round(value)),
    yFormat: (value) => (value >= 1000 ? `${Math.round(value / 1000)}k` : intFmt.format(Math.round(value))),
    xFormat: (time) => dateShort(time),
    min: 0,
    ariaLabel: 'Wikipedia-Pageviews zu Krankmeldung und Arbeitsunfähigkeit',
  });

  const legend = $('#sickLegend');
  if (legend) {
    legend.innerHTML = series.map((entry) => {
      const latest = entry.data.at(-1)?.y;
      return `<span class="chart__legend-item" style="color:${entry.color}"><i class="chart__legend-swatch" style="background:${entry.color}"></i>${escapeHtml(entry.label)} <strong>${latest != null ? compact(latest) : '—'}</strong></span>`;
    }).join('');
  }

  const stats = $('#sickStats');
  if (!stats) return;

  const standChange = stand?.prev7 > 0 ? ((stand.recent7 - stand.prev7) / stand.prev7) * 100 : null;
  const abilityChange = ability?.prev7 > 0 ? ((ability.recent7 - ability.prev7) / ability.prev7) * 100 : null;

  stats.innerHTML = [
    ['Krankenstand · 7T', stand ? compact(stand.recent7) : '—', standChange != null ? `${pct(standChange)} vs. Vorwoche` : 'Wikipedia · DE'],
    ['Arbeitsunfähigkeit · 7T', ability ? compact(ability.recent7) : '—', abilityChange != null ? `${pct(abilityChange)} vs. Vorwoche` : 'Wikipedia · DE'],
    ['News · 24h', news ? intFmt.format(news.count24h) : '—', news ? `${intFmt.format(news.count7d)} Artikel in 7T` : 'Google News · DE'],
    ['Sick Signal', score != null ? `${score}/100` : '—', 'Leading Indicator · 0–100'],
  ].map(([label, value, sub]) => `<div class="stat"><span class="stat__label">${escapeHtml(label)}</span><span class="stat__value">${escapeHtml(value)}</span><span class="stat__sub">${escapeHtml(sub)}</span></div>`).join('');
}

function renderWiki() {
  const osint = state.osint;
  if (!osint) return;
  const en = osint.wikipedia?.gta_en;
  const de = osint.wikipedia?.gta_de;

  const series = [
    { label: 'GTA VI · EN', color: '#ff2e88', data: (en?.series || []).slice(-state.wikiRange).map((point) => ({ x: point.date, y: point.views })) },
    { label: 'GTA VI · DE', color: '#21e6c1', data: (de?.series || []).slice(-state.wikiRange).map((point) => ({ x: point.date, y: point.views })) },
  ];

  createLineChart($('#wikiChart'), series, {
    height: 330,
    area: true,
    valueFormat: (value) => intFmt.format(Math.round(value)),
    yFormat: (value) => (value >= 1000 ? `${Math.round(value / 1000)}k` : intFmt.format(Math.round(value))),
    xFormat: (time) => dateShort(time),
    min: 0,
    ariaLabel: 'Wikipedia-Pageviews zu Grand Theft Auto VI',
  });

  const legend = $('#wikiLegend');
  if (legend) {
    legend.innerHTML = series.map((entry) => {
      const latest = entry.data.at(-1)?.y;
      return `<span class="chart__legend-item" style="color:${entry.color}"><i class="chart__legend-swatch" style="background:${entry.color}"></i>${escapeHtml(entry.label)} <strong>${latest != null ? compact(latest) : '—'}</strong></span>`;
    }).join('');
  }
}

function renderOsint() {
  const osint = state.osint;
  if (!osint) return;
  renderWiki();

  const wikiEn = osint.wikipedia?.gta_en;
  const wikiDe = osint.wikipedia?.gta_de;
  const newsEn = osint.news?.gta_en;
  const newsDe = osint.news?.gta_de;
  const reddit = osint.reddit;
  const steam = osint.steam;
  const hype = computeHypeScore();

  const stats = $('#osintStats');
  if (stats) {
    stats.innerHTML = [
      ['GTA VI · EN', wikiEn ? compact(wikiEn.recent7) : '—', 'Pageviews · 7T'],
      ['GTA VI · DE', wikiDe ? compact(wikiDe.recent7) : '—', 'Pageviews · 7T'],
      ['News · 24h', newsEn ? intFmt.format(newsEn.count24h) : '—', newsEn ? `${intFmt.format(newsEn.count7d)} Artikel in 7T` : 'Google News · EN'],
      ['r/GTA6', reddit?.subscribers ? compact(reddit.subscribers) : '—', reddit?.postsPerHour != null ? `${reddit.postsPerHour.toFixed(1).replace('.', ',')} Posts/h · ${reddit.sampleHours}h Sample` : 'Reddit Members'],
      ['Steam · GTA V', steam?.gta5 != null ? compact(steam.gta5) : '—', 'Concurrent Players'],
      ['Hype Signal', hype != null ? `${hype}/100` : '—', 'OSINT Composite · 0–100'],
    ].map(([label, value, sub]) => `<div class="stat"><span class="stat__label">${escapeHtml(label)}</span><span class="stat__value">${escapeHtml(value)}</span><span class="stat__sub">${escapeHtml(sub)}</span></div>`).join('');
  }

  const newsBadge = $('#newsBadge');
  if (newsBadge) {
    newsBadge.textContent = newsEn ? `${newsEn.count7d >= 100 ? '100+' : newsEn.count7d} · 7T` : '—';
    newsBadge.className = `badge ${newsEn ? 'is-ok' : 'is-degraded'}`;
  }

  const newsList = $('#newsList');
  if (newsList) {
    const source = newsEn?.items?.length ? newsEn : newsDe;
    if (!source?.items?.length) {
      newsList.innerHTML = '<p class="chart__empty">Keine Schlagzeilen verfügbar.</p>';
    } else {
      newsList.innerHTML = source.items.slice(0, 6).map((item) => `
        <a class="news-item" href="${escapeHtml(item.link)}" target="_blank" rel="noopener">
          <span class="news-item__title">${escapeHtml(item.title)}</span>
          <span class="news-item__meta"><span>${escapeHtml(item.source || 'Google News')}</span><span>${escapeHtml(relative(item.pubDate))}</span></span>
        </a>`).join('');
    }
  }

  const redditBadge = $('#redditBadge');
  if (redditBadge) {
    redditBadge.textContent = reddit?.subscribers ? `${compact(reddit.subscribers)} Members` : '—';
    redditBadge.className = `badge ${reddit?.error ? 'is-degraded' : 'is-ok'}`;
  }

  const redditList = $('#redditList');
  if (redditList) {
    if (!reddit?.topPosts?.length) {
      redditList.innerHTML = `<p class="chart__empty">Reddit-Daten gerade nicht verfügbar.${reddit?.error ? ` ${escapeHtml(reddit.error)}` : ''}</p>`;
    } else {
      redditList.innerHTML = reddit.topPosts.slice(0, 5).map((post) => `
        <a class="reddit-item" href="${escapeHtml(post.link)}" target="_blank" rel="noopener">
          <span class="reddit-item__title">${escapeHtml(post.title)}</span>
          <span class="reddit-item__meta"><span class="reddit-item__score">▲ ${compact(post.score)}</span><span>${compact(post.comments)} Kommentare</span><span>${escapeHtml(relative(post.createdUtc * 1000))}</span></span>
        </a>`).join('');
    }
  }

  const trendList = $('#trendList');
  if (trendList) {
    const trends = osint.trends?.de;
    const items = trends?.gta?.length ? trends.gta : (trends?.items || []);
    if (!items.length) {
      trendList.innerHTML = '<p class="chart__empty">Google Trends liefert gerade keine Daten.</p>';
    } else {
      const prefix = trends?.gta?.length
        ? ''
        : '<p class="chart__empty" style="margin-bottom:6px">GTA trendet aktuell nicht in den DE-Top-10. Hier die Top-Trends:</p>';
      trendList.innerHTML = prefix + items.slice(0, 6).map((item) => {
        const isGta = /gta|grand theft auto|rockstar|leonida|vice city/i.test(`${item.title} ${item.newsTitle}`);
        return `<div class="trend-item ${isGta ? 'is-gta' : ''}"><span class="trend-item__title">${escapeHtml(item.title)}</span><span class="trend-item__traffic">${escapeHtml(item.traffic || '')}</span></div>`;
      }).join('');
    }
  }
}

function preloadCountdown(dateString) {
  const diff = Math.max(new Date(dateString).getTime() - Date.now(), 0);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000) % 24;
  const minutes = Math.floor(diff / 60000) % 60;
  return `${days}T ${String(hours).padStart(2, '0')}H ${String(minutes).padStart(2, '0')}M`;
}

function renderNetwork() {
  const network = state.network;
  if (!network) return;
  const decix = network.decix;
  const preload = network.preload || state.osint?.preload || FALLBACK_RELEASE;

  if (decix?.traffic2d?.length) {
    const series = [{
      label: 'DE-CIX Frankfurt',
      color: '#21e6c1',
      data: decix.traffic2d.map((point) => ({ x: point.clock, y: point.value / 1e12 })),
    }];

    createLineChart($('#decixChart'), series, {
      height: 340,
      area: true,
      valueFormat: (value) => `${value.toFixed(2).replace('.', ',')} Tbit/s`,
      yFormat: (value) => `${value.toFixed(0)}T`,
      xFormat: (time) => new Intl.DateTimeFormat('de-DE', { weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(time)),
      ariaLabel: 'DE-CIX Frankfurt Traffic der letzten zwei Tage',
      referenceLines: decix.meta?.allTimePeak
        ? [{ value: decix.meta.allTimePeak / 1e12, label: 'ALL-TIME PEAK', color: 'rgba(255,200,87,0.7)' }]
        : [],
    });

    const meta = $('#decixMeta');
    if (meta) {
      const values = decix.traffic2d.map((point) => point.value);
      const avg = average(values);
      meta.innerHTML = [
        ['Aktuell', tbit(decix.meta?.current)],
        ['All-Time Peak', tbit(decix.meta?.allTimePeak)],
        ['2T Peak', tbit(decix.meta?.graphPeak)],
        ['2T Average', tbit(avg)],
      ].map(([label, value]) => `<div class="decix-meta__item"><span class="decix-meta__label">${label}</span><span class="decix-meta__value">${value}</span></div>`).join('');
    }
  } else {
    const chart = $('#decixChart');
    if (chart) chart.innerHTML = '<p class="chart__empty">DE-CIX-Daten gerade nicht verfügbar.</p>';
  }

  const statusBox = $('#preloadStatus');
  if (statusBox) {
    const status = preload.status || 'upcoming';
    const target = status === 'upcoming' ? preload.ps5Preload : preload.release;
    const statusLabel = status === 'upcoming' ? 'PRELOAD IN' : status === 'preload' ? 'RELEASE IN' : 'LIVE';
    const statusText =
      status === 'upcoming'
        ? 'PS5-Preload startet am 10. November um 00:00 lokal. Xbox startet weltweit um 00:00 GMT (01:00 CET).'
        : status === 'preload'
          ? 'Der Preload läuft. 212 GB pro Installation — der DE-CIX wird es sehen.'
          : 'GTA VI ist released. Willkommen in Leonida.';
    const badgeText = status === 'upcoming' ? 'PRELOAD GEPLANT' : status === 'preload' ? 'PRELOAD LÄUFT' : 'RELEASED';

    statusBox.innerHTML = `
      <span class="preload-status__badge"><span class="live-dot"></span> ${badgeText}</span>
      <span class="preload-status__big">${status === 'released' ? 'LIVE' : preloadCountdown(target)}</span>
      <p class="preload-status__text">${escapeHtml(statusText)}</p>`;
  }

  const timeline = $('#preloadTimeline');
  if (timeline) {
    const now = Date.now();
    const steps = [
      { label: 'Preorder', date: preload.preorder || FALLBACK_RELEASE.preorder },
      { label: 'PS5 Preload', date: preload.ps5Preload || FALLBACK_RELEASE.ps5Preload },
      { label: 'Physical', date: preload.physical || FALLBACK_RELEASE.physical },
      { label: 'Release', date: preload.release || FALLBACK_RELEASE.release },
    ];
    let nextMarked = false;
    timeline.innerHTML = steps.map((step) => {
      const time = new Date(step.date).getTime();
      const isDone = time <= now;
      const isNext = !isDone && !nextMarked;
      if (isNext) nextMarked = true;
      const cls = isDone ? 'is-done' : isNext ? 'is-next' : '';
      return `<div class="preload-step ${cls}"><span class="preload-step__dot"></span><span class="preload-step__title">${escapeHtml(step.label)}</span><span class="preload-step__date">${dateShort(step.date)}</span></div>`;
    }).join('');
  }

  const stats = $('#networkStats');
  if (stats) {
    const steam = state.osint?.steam;
    const rockstar = network.rockstar;
    stats.innerHTML = [
      ['DE-CIX · Aktuell', tbit(decix?.meta?.current), 'Frankfurt · live'],
      ['DE-CIX · All-Time', tbit(decix?.meta?.allTimePeak), 'Peak'],
      ['Rockstar Probe', rockstar?.latencyMs != null ? `${rockstar.latencyMs} ms` : '—', rockstar?.status ? `HTTP ${rockstar.status} · /VI` : 'Endpoint'],
      ['Steam · GTA V', steam?.gta5 != null ? compact(steam.gta5) : '—', 'Concurrent Players'],
    ].map(([label, value, sub]) => `<div class="stat"><span class="stat__label">${escapeHtml(label)}</span><span class="stat__value">${escapeHtml(value)}</span><span class="stat__sub">${escapeHtml(sub)}</span></div>`).join('');
  }
}

function renderTimeline() {
  const list = $('#timelineList');
  if (!list) return;
  const now = Date.now();
  let nextMarked = false;

  list.innerHTML = TIMELINE_EVENTS.map((event) => {
    const time = new Date(`${event.date}T12:00:00Z`).getTime();
    const isPast = time < now;
    const isNext = !isPast && !nextMarked;
    if (isNext) nextMarked = true;
    const cls = isPast ? 'is-past' : isNext ? 'is-next' : '';
    return `<article class="timeline-item ${cls}">
      <div class="timeline-item__date">${dateShort(event.date)}<br>${new Date(event.date).getFullYear()}</div>
      <div class="timeline-item__body"><span class="timeline-item__tag">${escapeHtml(event.tag)}</span><h3 class="timeline-item__title">${escapeHtml(event.title)}</h3><p class="timeline-item__text">${escapeHtml(event.text)}</p></div>
    </article>`;
  }).join('');
}

function renderMethodology() {
  const meta = state.meta;
  const sources = {
    ...(meta?.sources || {}),
    decix: state.network?.sources?.decix,
    playstation: state.osint?.sources?.playstation,
  };
  const statusBadge = $('#sourceStatus');
  const values = Object.values(sources).filter(Boolean);
  const degraded = values.filter((value) => value !== 'ok').length;

  if (statusBadge) {
    statusBadge.textContent = degraded ? `${degraded} QUELLE(N) DEGRADED` : 'ALLE QUELLEN OK';
    statusBadge.className = `badge ${degraded ? 'is-degraded' : 'is-ok'}`;
  }

  const sourceList = $('#sourceList');
  if (sourceList) {
    sourceList.innerHTML = Object.entries(SOURCE_LABELS).map(([key, label]) => {
      const status = sources[key] || '—';
      const cls = status === 'ok' ? 'is-ok' : 'is-degraded';
      return `<div class="source-item"><span>${escapeHtml(label)}</span><strong class="${cls}">${escapeHtml(status)}</strong></div>`;
    }).join('');
  }

  const lastUpdate = $('#lastUpdate');
  if (lastUpdate) {
    lastUpdate.textContent = meta?.lastRun
      ? `letztes Update: ${dateTimeFmt.format(new Date(meta.lastRun))}`
      : 'letztes Update: —';
  }
}

function setupNav() {
  const toggle = $('#menuToggle');
  const nav = $('#siteNav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  $$('a', nav).forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function setupRangeTabs() {
  $$('[data-range-tabs]').forEach((group) => {
    group.addEventListener('click', (event) => {
      const button = event.target.closest('[data-range]');
      if (!button) return;
      const value = Number(button.dataset.range);
      $$('[data-range]', group).forEach((item) => item.classList.toggle('is-active', item === button));
      if (group.dataset.rangeTabs === 'wiki') {
        state.wikiRange = value;
        renderWiki();
      } else {
        state.marketRange = value;
        renderBaskets();
        renderStocks();
      }
    });
  });
}

function setupStockFilters() {
  const filters = $('#stockFilters');
  if (!filters) return;
  filters.addEventListener('click', (event) => {
    const button = event.target.closest('[data-group]');
    if (!button) return;
    state.group = button.dataset.group;
    $$('[data-group]', filters).forEach((item) => item.classList.toggle('is-active', item === button));
    renderStocks();
  });
}

function setupReveal() {
  const items = $$('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
  );
  items.forEach((item) => observer.observe(item));
}

async function init() {
  await loadData();
  renderCountdown();
  renderTicker();
  renderHero();
  renderBaskets();
  renderStocks();
  renderSick();
  renderOsint();
  renderNetwork();
  renderTimeline();
  renderMethodology();
  setupNav();
  setupRangeTabs();
  setupStockFilters();
  setupReveal();
  setInterval(renderCountdown, 1000);
}

init();
