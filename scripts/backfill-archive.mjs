// One-off/idempotent: rebuild the append-only archives from every data
// snapshot in git history, then merge them into the current data files.
// Usage: node scripts/backfill-archive.mjs
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { extendArchives, mergeItems } from './lib/archive.mjs';

const DATA = path.resolve('data');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const show = (rev, file) => {
  try {
    return JSON.parse(execFileSync('git', ['show', `${rev}:data/${file}`], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }));
  } catch {
    return null;
  }
};
const read = async (file) => {
  try {
    return JSON.parse(await fs.readFile(path.join(DATA, file), 'utf8'));
  } catch {
    return null;
  }
};
const write = (file, data) => fs.writeFile(path.join(DATA, file), `${JSON.stringify(data, null, 2)}\n`, 'utf8');

const revs = git('log', '--reverse', '--format=%H %cI', '--', 'data/osint.json')
  .trim()
  .split('\n')
  .filter(Boolean)
  .map((line) => line.split(' '));

let acc = { osint: null, hype: null, investor: null, timeline: null, newsArchive: null };

for (const [rev, committedAt] of revs) {
  const osint = show(rev, 'osint.json');
  if (!osint) continue;
  const meta = show(rev, 'meta.json');
  const at = new Date(meta?.lastRun || osint.updated || committedAt);
  const snapshot = {
    at,
    stocks: show(rev, 'stocks.json'),
    osint,
    hype: show(rev, 'hype.json'),
    investor: show(rev, 'investor.json'),
    network: show(rev, 'network.json'),
  };
  const { timeline, newsArchive } = extendArchives({
    ...snapshot,
    existingOsint: acc.osint,
    existingHype: acc.hype,
    existingInvestor: acc.investor,
    existingTimeline: acc.timeline,
    existingNewsArchive: acc.newsArchive,
  });
  acc = { osint: snapshot.osint, hype: snapshot.hype || acc.hype, investor: snapshot.investor || acc.investor, timeline, newsArchive };
}

// Merge the reconstructed history into the current files (current data wins for identical keys).
const current = {
  stocks: await read('stocks.json'),
  osint: await read('osint.json'),
  hype: await read('hype.json'),
  investor: await read('investor.json'),
  network: await read('network.json'),
  meta: await read('meta.json'),
  timeline: await read('timeline.json'),
  newsArchive: await read('news-archive.json'),
};

const existingNewsArchive = { ...acc.newsArchive };
for (const group of ['news', 'hype']) {
  existingNewsArchive[group] = { ...(acc.newsArchive?.[group] || {}) };
  for (const [key, items] of Object.entries(current.newsArchive?.[group] || {})) {
    existingNewsArchive[group][key] = mergeItems(existingNewsArchive[group][key], items, (item) => item.link || item.title);
  }
}
existingNewsArchive.reddit = mergeItems(acc.newsArchive?.reddit, current.newsArchive?.reddit, (post) => post.id || post.link);
existingNewsArchive.trends = mergeItems(acc.newsArchive?.trends, current.newsArchive?.trends, (item) => `${item.geo}|${item.title}|${item.pubDate}`);

const { timeline, newsArchive } = extendArchives({
  at: new Date(current.meta?.lastRun || current.osint?.updated || Date.now()),
  stocks: current.stocks,
  osint: current.osint,
  hype: current.hype,
  investor: current.investor,
  network: current.network,
  existingOsint: acc.osint,
  existingHype: acc.hype,
  existingInvestor: acc.investor,
  existingTimeline: { snapshots: [...(acc.timeline?.snapshots || []), ...(current.timeline?.snapshots || [])] },
  existingNewsArchive,
});

await Promise.all([
  write('osint.json', current.osint),
  write('hype.json', current.hype),
  write('investor.json', current.investor),
  write('timeline.json', timeline),
  write('news-archive.json', newsArchive),
]);

console.log(
  `[backfill] ${revs.length} commits → ${timeline.snapshots.length} timeline snapshots, ` +
    `${Object.values(newsArchive.news).reduce((n, items) => n + items.length, 0)} archived headlines, ` +
    `news history ${current.osint.news?.gta_en?.history?.length ?? 0} days`,
);
