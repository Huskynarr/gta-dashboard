import fs from 'node:fs/promises';
import path from 'node:path';
import { collectStocks } from './lib/stocks.mjs';
import { collectOsint } from './lib/osint.mjs';
import { collectNetwork } from './lib/network.mjs';
import { collectInvestor } from './lib/investor.mjs';

const DATA_DIR = path.resolve('data');

const RELEASE = {
  preorder: '2026-06-25T00:00:00+02:00',
  ps5Preload: '2026-11-10T00:00:00+01:00',
  xboxPreload: '2026-11-10T00:00:00Z',
  physical: '2026-11-12T00:00:00+01:00',
  release: '2026-11-19T00:00:00+01:00',
  storageGB: 212,
  priceUSD: 79.99,
  ultimateUSD: 99.99,
};

async function readJson(file, fallback = null) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function writeJson(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function runSlot(date = new Date()) {
  return date.getUTCHours() < 12 ? 'morning' : 'evening';
}

async function main() {
  const startedAt = new Date();

  const [existingStocks, existingOsint, existingNetwork, existingInvestor] =
    await Promise.all([
      readJson(path.join(DATA_DIR, 'stocks.json')),
      readJson(path.join(DATA_DIR, 'osint.json')),
      readJson(path.join(DATA_DIR, 'network.json')),
      readJson(path.join(DATA_DIR, 'investor.json')),
    ]);

  const stocksPromise = collectStocks(existingStocks).catch((error) => ({
    ...(existingStocks || {}),
    updated: new Date().toISOString(),
    errors: [`collector:stocks: ${error.message}`],
  }));

  const osintPromise = collectOsint(existingOsint).catch((error) => ({
    ...(existingOsint || {}),
    updated: new Date().toISOString(),
    errors: [`collector:osint: ${error.message}`],
  }));

  const investorPromise = collectInvestor(existingInvestor).catch((error) => ({
    ...(existingInvestor || {}),
    updated: new Date().toISOString(),
    errors: [`collector:investor: ${error.message}`],
  }));

  const [stocks, osint, investor] = await Promise.all([
    stocksPromise,
    osintPromise,
    investorPromise,
  ]);

  const network = await collectNetwork(existingNetwork, osint).catch((error) => ({
    ...(existingNetwork || {}),
    updated: new Date().toISOString(),
    error: error.message,
  }));

  const finishedAt = new Date();

  const meta = {
    lastRun: finishedAt.toISOString(),
    startedAt: startedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    runSlot: runSlot(startedAt),
    release: RELEASE,
    sources: {
      stocks: stocks?.errors?.length ? 'degraded' : 'ok',
      osint: osint?.errors?.length ? 'degraded' : 'ok',
      network: network?.sources?.decix || 'degraded',
      reddit: osint?.sources?.reddit || 'degraded',
      steam: osint?.sources?.steam || 'degraded',
      trends: osint?.sources?.trends || 'degraded',
      rockstar: osint?.sources?.rockstar || 'degraded',
      investor: investor?.sources?.ir || 'degraded',
      sec: investor?.sources?.sec || 'degraded',
      estimates: investor?.sources?.estimates || 'degraded',
    },
    counts: {
      stocks: Object.keys(stocks?.series || {}).length,
      stockHistory: Object.values(stocks?.series || {}).reduce(
        (total, stock) => total + (stock?.history?.length || 0),
        0,
      ),
      snapshots: stocks?.snapshots?.length || 0,
      wikiSeries: Object.keys(osint?.wikipedia || {}).length,
      newsQueries: Object.keys(osint?.news || {}).length,
      decixPoints: network?.decix?.traffic2d?.length || 0,
      filings: investor?.filings?.length || 0,
      pressReleases: investor?.pressReleases?.length || 0,
    },
    errors: [
      ...(stocks?.errors || []),
      ...(osint?.errors || []),
      ...(investor?.errors || []),
      ...(network?.decixError ? [`decix: ${network.decixError}`] : []),
    ],
  };

  await Promise.all([
    writeJson(path.join(DATA_DIR, 'stocks.json'), stocks),
    writeJson(path.join(DATA_DIR, 'osint.json'), osint),
    writeJson(path.join(DATA_DIR, 'network.json'), network),
    writeJson(path.join(DATA_DIR, 'investor.json'), investor),
    writeJson(path.join(DATA_DIR, 'meta.json'), meta),
  ]);

  console.log(
    `[collect] ${meta.runSlot} run finished in ${meta.durationMs}ms — ` +
      `${meta.counts.stocks} stocks, ${meta.counts.stockHistory} history points, ` +
      `${meta.counts.decixPoints} DE-CIX points, ${meta.counts.filings} filings`,
  );

  if (meta.errors.length) {
    console.warn(`[collect] ${meta.errors.length} source warning(s):`);
    for (const error of meta.errors) console.warn(`  - ${error}`);
  }
}

main().catch((error) => {
  console.error('[collect] fatal:', error);
  process.exitCode = 1;
});
