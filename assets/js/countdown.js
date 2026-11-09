// Per-country release countdown.
// PS5 preload and the release unlock at 00:00 *local time*; the Xbox preload
// starts at 00:00 GMT worldwide. The country is detected from the browser
// (time zone first, then locale region) and can be changed with a picker.

const STORAGE_KEY = 'gta-dashboard-country';

// id → [ISO country code, IANA time zone]. Multi-zone countries get one entry per main zone.
export const COUNTRIES = [
  ['DE', 'DE', 'Europe/Berlin'],
  ['AT', 'AT', 'Europe/Vienna'],
  ['CH', 'CH', 'Europe/Zurich'],
  ['FR', 'FR', 'Europe/Paris'],
  ['BE', 'BE', 'Europe/Brussels'],
  ['NL', 'NL', 'Europe/Amsterdam'],
  ['LU', 'LU', 'Europe/Luxembourg'],
  ['IT', 'IT', 'Europe/Rome'],
  ['ES', 'ES', 'Europe/Madrid'],
  ['PT', 'PT', 'Europe/Lisbon'],
  ['GB', 'GB', 'Europe/London'],
  ['IE', 'IE', 'Europe/Dublin'],
  ['DK', 'DK', 'Europe/Copenhagen'],
  ['SE', 'SE', 'Europe/Stockholm'],
  ['NO', 'NO', 'Europe/Oslo'],
  ['FI', 'FI', 'Europe/Helsinki'],
  ['PL', 'PL', 'Europe/Warsaw'],
  ['CZ', 'CZ', 'Europe/Prague'],
  ['TR', 'TR', 'Europe/Istanbul'],
  ['US-E', 'US', 'America/New_York'],
  ['US-C', 'US', 'America/Chicago'],
  ['US-M', 'US', 'America/Denver'],
  ['US-W', 'US', 'America/Los_Angeles'],
  ['CA-E', 'CA', 'America/Toronto'],
  ['CA-W', 'CA', 'America/Vancouver'],
  ['MX', 'MX', 'America/Mexico_City'],
  ['BR', 'BR', 'America/Sao_Paulo'],
  ['AR', 'AR', 'America/Argentina/Buenos_Aires'],
  ['ZA', 'ZA', 'Africa/Johannesburg'],
  ['AE', 'AE', 'Asia/Dubai'],
  ['IN', 'IN', 'Asia/Kolkata'],
  ['JP', 'JP', 'Asia/Tokyo'],
  ['KR', 'KR', 'Asia/Seoul'],
  ['AU-E', 'AU', 'Australia/Sydney'],
  ['AU-W', 'AU', 'Australia/Perth'],
  ['NZ', 'NZ', 'Pacific/Auckland'],
].map(([id, country, tz]) => ({ id, country, tz }));

const TEXT = {
  de: { country: 'Land', auto: 'Automatisch', local: 'Ortszeit', preload: 'Preload', release: 'Release' },
  en: { country: 'Country', auto: 'Automatic', local: 'local time', preload: 'Preload', release: 'Release' },
  fr: { country: 'Pays', auto: 'Automatique', local: 'heure locale', preload: 'Préchargement', release: 'Sortie' },
};

const lang = () => (TEXT[document.documentElement.lang] ? document.documentElement.lang : 'de');

function browserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

function browserRegions() {
  const locales = navigator.languages?.length ? navigator.languages : [navigator.language || ''];
  return locales
    .map((locale) => {
      try {
        return new Intl.Locale(locale).maximize().region;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

/** Detect the country entry for this browser: exact time zone → locale region → Germany. */
export function detectCountry(tz = browserTimeZone(), regions = browserRegions()) {
  const byZone = COUNTRIES.find((entry) => entry.tz === tz);
  if (byZone) return { ...byZone, tz: tz || byZone.tz };
  for (const region of regions) {
    const byRegion = COUNTRIES.find((entry) => entry.country === region);
    // Region matches but the zone is unknown to the list: keep the browser zone, it is the most precise.
    if (byRegion) return { ...byRegion, tz: isValidZone(tz) ? tz : byRegion.tz };
  }
  return isValidZone(tz) ? { id: 'auto', country: null, tz } : COUNTRIES[0];
}

function isValidZone(tz) {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function tzOffsetMs(timestamp, tz) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(timestamp)
      .map((part) => [part.type, part.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute, +parts.second);
  return asUtc - timestamp;
}

/** Epoch ms of 00:00 on `day` (YYYY-MM-DD) in time zone `tz`. */
export function localMidnight(day, tz) {
  const [y, m, d] = day.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d);
  const first = guess - tzOffsetMs(guess, tz);
  return guess - tzOffsetMs(first, tz);
}

const dayOf = (value, fallback) => String(value || fallback).slice(0, 10);

/** Milestones for a time zone, derived from the release config. */
export function milestones(release, tz) {
  return {
    ps5Preload: localMidnight(dayOf(release.ps5Preload, '2026-11-10'), tz),
    xboxPreload: Date.parse(release.xboxPreload || '2026-11-10T00:00:00Z'),
    release: localMidnight(dayOf(release.release, '2026-11-19'), tz),
  };
}

function flag(country) {
  if (!country) return '🌐';
  return String.fromCodePoint(...[...country].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65));
}

function countryName(entry, language) {
  const city = entry.tz.split('/').pop().replaceAll('_', ' ');
  if (!entry.country) return entry.tz.replaceAll('_', ' ');
  let name = entry.country;
  try {
    name = new Intl.DisplayNames([language], { type: 'region' }).of(entry.country) || entry.country;
  } catch {
    // Older browsers: keep the ISO code.
  }
  const multiZone = COUNTRIES.filter((item) => item.country === entry.country).length > 1;
  return multiZone || !COUNTRIES.some((item) => item.tz === entry.tz) ? `${name} · ${city}` : name;
}

function readChoice() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'auto';
  } catch {
    return 'auto';
  }
}

function saveChoice(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Private mode: choice only lasts for this page view.
  }
}

export function createCountryCountdown(select) {
  const detected = detectCountry();
  let choice = readChoice();
  if (choice !== 'auto' && !COUNTRIES.some((entry) => entry.id === choice)) choice = 'auto';
  let renderedLang = null;

  const current = () => (choice === 'auto' ? detected : COUNTRIES.find((entry) => entry.id === choice));

  function fillOptions() {
    const language = lang();
    if (!select || renderedLang === language) return;
    renderedLang = language;
    const options = [
      `<option value="auto">${flag(detected.country)} ${TEXT[language].auto} · ${countryName(detected, language)}</option>`,
      ...COUNTRIES.map((entry) => ({ entry, label: countryName(entry, language) }))
        .sort((a, b) => a.label.localeCompare(b.label, language))
        .map(({ entry, label }) => `<option value="${entry.id}">${flag(entry.country)} ${label}</option>`),
    ];
    select.innerHTML = options.join('');
    select.value = choice;
    select.setAttribute('aria-label', TEXT[language].country);
    const caption = select.closest('label')?.querySelector('[data-country-caption]');
    if (caption) caption.textContent = TEXT[language].country;
  }

  select?.addEventListener('change', () => {
    choice = select.value;
    saveChoice(choice);
  });

  return function state(release, now = Date.now()) {
    fillOptions();
    const entry = current();
    const language = lang();
    const times = milestones(release, entry.tz);
    const format = (timestamp, options) =>
      new Intl.DateTimeFormat(language, { timeZone: entry.tz, ...options }).format(timestamp);
    const time = (timestamp) =>
      format(timestamp, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
    const where = `${flag(entry.country)} ${countryName(entry, language)}`;

    if (now >= times.release) {
      return { phase: 'released', target: times.release, entry, text: `${where} · ${format(times.release, { dateStyle: 'long' })}` };
    }

    const preloads = [times.ps5Preload, times.xboxPreload].filter((timestamp) => timestamp > now);
    if (preloads.length) {
      return {
        phase: 'preload',
        target: Math.min(...preloads),
        entry,
        text: `${where} · PS5 ${time(times.ps5Preload)} · Xbox ${time(times.xboxPreload)} · 212 GB`,
      };
    }

    return {
      phase: 'release',
      target: times.release,
      entry,
      text: `${where} · ${format(times.release, { dateStyle: 'long', timeStyle: 'short' })} ${TEXT[language].local} (${format(times.release, { timeZoneName: 'short' }).split(' ').pop()})`,
    };
  };
}
