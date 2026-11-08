import {
  decodeEntities,
  fetchJson,
  fetchText,
  fetchWithTimeout,
  stripTags,
} from './http.mjs';

const IR_URL = 'https://ir.take2games.com/';
const SEC_URL = 'https://data.sec.gov/submissions/CIK0000946581.json';
const SEC_UA = 'gta-dashboard/1.0 (contact: huskynarr)';

function clean(value = '') {
  return decodeEntities(stripTags(value)).replace(/\s+/g, ' ').trim();
}

function parseIrDate(label) {
  const match = String(label).match(
    /([A-Z][a-z]+ \d{1,2}, \d{4}) at (\d{1,2}):(\d{2}) (AM|PM) UTC/i,
  );
  if (!match) return null;

  const [, datePart, hour, minute, ampm] = match;
  const normalizedHour =
    (Number(hour) % 12) + (ampm.toUpperCase() === 'PM' ? 12 : 0);
  const date = new Date(
    `${datePart} ${String(normalizedHour).padStart(2, '0')}:${minute}:00 UTC`,
  );

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseDateOnly(label) {
  const date = new Date(`${clean(label)} 12:00:00 UTC`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function absoluteIrUrl(href) {
  if (!href) return null;
  if (href.startsWith('http')) return href;
  return new URL(href, IR_URL).toString();
}

function parseIr(html) {
  const pressReleases = [];
  const blocks =
    html.match(
      /<div class="investorRelations_pressReleaseItem[^"]*">[\s\S]*?<\/div>/gi,
    ) || [];

  for (const block of blocks) {
    const date = block.match(/<p class="type-title">([\s\S]*?)<\/p>/i);
    const title = block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
    const href = block.match(/<a href="([^"]+)"/i);

    if (!title) continue;

    pressReleases.push({
      date: date ? parseDateOnly(clean(date[1])) : null,
      dateLabel: date ? clean(date[1]) : '',
      title: clean(title[1]),
      url: absoluteIrUrl(href?.[1]),
    });
  }

  const earningsCall = html.match(
    /<p class="type-title">([^<]*)<\/p>\s*<h3[^>]*>([^<]*Earnings Conference Call[^<]*)<\/h3>[\s\S]*?href="(https:\/\/events\.q4inc\.com\/attendee\/\d+)"/i,
  );
  const annualMeeting = html.match(
    /<p class="type-title">([^<]*)<\/p>\s*<h3[^>]*>([^<]*Annual Shareholder Meeting[^<]*)<\/h3>[\s\S]*?href="(https:\/\/www\.virtualshareholdermeeting\.com\/[^"]+)"/i,
  );
  const resultsTitle = html.match(
    />([^<]*to Report Second Quarter Fiscal Year 2027 Results[^<]*)</i,
  );
  const resultsDateMatch = resultsTitle
    ? clean(resultsTitle[1]).match(/on \w+, ([A-Z][a-z]+ \d{1,2}, \d{4})/)
    : null;
  const resultsHref = html.match(
    /href="([^"]*second-quarter-fiscal-8[^"]*)"/i,
  );

  return {
    earnings: earningsCall
      ? {
          title: clean(earningsCall[2]),
          dateLabel: clean(earningsCall[1]),
          date: parseIrDate(clean(earningsCall[1])),
          webcastUrl: earningsCall[3],
          resultsTitle: resultsTitle ? clean(resultsTitle[1]) : null,
          resultsDate: resultsDateMatch ? parseDateOnly(resultsDateMatch[1]) : null,
          resultsUrl: absoluteIrUrl(resultsHref?.[1]),
        }
      : null,
    annualMeeting: annualMeeting
      ? {
          title: clean(annualMeeting[2]),
          dateLabel: clean(annualMeeting[1]),
          date: parseIrDate(clean(annualMeeting[1])),
          url: annualMeeting[3],
        }
      : null,
    pressReleases: pressReleases.slice(0, 6),
  };
}

function parseSec(json) {
  const recent = json?.filings?.recent;
  if (!recent) return [];

  const filings = [];
  const forms = new Set(['10-Q', '10-K', '8-K', 'DEF 14A']);

  for (let index = 0; index < recent.form.length; index += 1) {
    const form = recent.form[index];
    if (!forms.has(form)) continue;

    const accession = recent.accessionNumber[index];
    const primaryDocument = recent.primaryDocument[index];

    filings.push({
      form,
      filingDate: recent.filingDate[index],
      reportDate: recent.reportDate[index],
      description: recent.primaryDocDescription[index] || '',
      accession,
      url: accession && primaryDocument
        ? `https://www.sec.gov/Archives/edgar/data/946581/${accession.replaceAll('-', '')}/${primaryDocument}`
        : null,
    });
  }

  return filings
    .sort((a, b) => String(b.filingDate).localeCompare(String(a.filingDate)))
    .slice(0, 8);
}

async function collectEstimates() {
  const cookieRes = await fetchWithTimeout(
    'https://fc.yahoo.com',
    { headers: { Accept: 'text/html' } },
    20000,
  );
  const cookies = cookieRes.headers.getSetCookie?.() || [];
  const cookie = cookies.map((value) => value.split(';')[0]).join('; ');
  if (!cookie) throw new Error('no Yahoo cookie');

  const crumbRes = await fetchWithTimeout(
    'https://query1.finance.yahoo.com/v1/test/getcrumb',
    { headers: { Cookie: cookie, Accept: 'text/plain' } },
    20000,
  );
  const crumb = (await crumbRes.text()).trim();
  if (!crumb) throw new Error('no Yahoo crumb');

  const json = await fetchJson(
    'https://query1.finance.yahoo.com/v10/finance/quoteSummary/TTWO' +
      '?modules=calendarEvents,earningsTrend&crumb=' +
      encodeURIComponent(crumb),
    { headers: { Cookie: cookie, Accept: 'application/json' } },
  );

  const result = json?.quoteSummary?.result?.[0];
  const earnings = result?.calendarEvents?.earnings;
  if (!earnings) throw new Error('no calendar events');

  const raw = (value) => value?.raw ?? null;
  const trend = result?.earningsTrend?.trend?.find(
    (item) => item.period === '0q',
  );

  return {
    epsAverage: raw(earnings.earningsAverage),
    epsLow: raw(earnings.earningsLow),
    epsHigh: raw(earnings.earningsHigh),
    revenueAverage: raw(earnings.revenueAverage),
    revenueLow: raw(earnings.revenueLow),
    revenueHigh: raw(earnings.revenueHigh),
    earningsDate: earnings.earningsDate?.[0]?.fmt || null,
    earningsCallDate: earnings.earningsCallDate?.[0]?.fmt || null,
    isEstimate: Boolean(earnings.isEarningsDateEstimate),
    epsYearAgo: raw(trend?.earningsEstimate?.yearAgoEps),
    analysts: trend?.earningsEstimate?.numberOfAnalysts?.raw ?? null,
    source: 'Yahoo Finance quoteSummary',
  };
}

export async function collectInvestor(existing = null) {
  const output = {
    updated: new Date().toISOString(),
    earnings: existing?.earnings || null,
    estimates: existing?.estimates || null,
    annualMeeting: existing?.annualMeeting || null,
    pressReleases: existing?.pressReleases || [],
    filings: existing?.filings || [],
    sources: {},
    errors: [],
  };

  try {
    const html = await fetchText(IR_URL, {
      headers: { Accept: 'text/html,application/xhtml+xml' },
    });
    const parsed = parseIr(html);

    if (parsed.earnings) output.earnings = parsed.earnings;
    if (parsed.annualMeeting) output.annualMeeting = parsed.annualMeeting;
    if (parsed.pressReleases.length) output.pressReleases = parsed.pressReleases;
    output.sources.ir = 'ok';
  } catch (error) {
    output.sources.ir = 'degraded';
    output.errors.push(`ir: ${error.message}`);
  }

  try {
    const json = await fetchJson(SEC_URL, {
      headers: {
        Accept: 'application/json',
        'User-Agent': SEC_UA,
      },
    });

    const filings = parseSec(json);
    if (filings.length) output.filings = filings;
    output.sources.sec = 'ok';
  } catch (error) {
    output.sources.sec = 'degraded';
    output.errors.push(`sec: ${error.message}`);
  }

  try {
    output.estimates = await collectEstimates();
    output.sources.estimates = 'ok';
  } catch (error) {
    output.sources.estimates = 'degraded';
    output.errors.push(`estimates: ${error.message}`);
  }

  return output;
}
