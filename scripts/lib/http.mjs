export const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithTimeout(url, options = {}, timeoutMs = 25000) {
  const res = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      'User-Agent': UA,
      'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
      ...(options.headers || {}),
    },
  });
  return res;
}

export async function fetchText(url, options = {}, timeoutMs = 25000) {
  const res = await fetchWithTimeout(url, options, timeoutMs);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${url}`);
  }
  return res.text();
}

export async function fetchJson(url, options = {}, timeoutMs = 25000) {
  const text = await fetchText(url, options, timeoutMs);
  return JSON.parse(text);
}

export function decodeEntities(input = '') {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

export function stripTags(input = '') {
  return decodeEntities(input.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseRss(xml) {
  const items = [];
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];

  for (const block of blocks) {
    const pick = (tag) => {
      const match = block.match(
        new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'),
      );
      return match ? stripTags(match[1]) : '';
    };

    const sourceMatch = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i);

    items.push({
      title: pick('title'),
      link: pick('link'),
      pubDate: pick('pubDate'),
      source: sourceMatch ? stripTags(sourceMatch[1]) : '',
      description: pick('description'),
    });
  }

  return items;
}

export function round(value, digits = 2) {
  if (value == null || !Number.isFinite(Number(value))) return null;
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
}

export function isoDay(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function compactDate(date = new Date()) {
  return isoDay(date).replaceAll('-', '');
}

export function daysAgo(days, from = new Date()) {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}
