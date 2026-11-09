import fs from 'node:fs/promises';
import { collectHype } from './lib/hype.mjs';

const read = async (name) => {
  try { return JSON.parse(await fs.readFile(new URL(`../data/${name}.json`, import.meta.url), 'utf8')); }
  catch { return null; }
};
const [existing, osint] = await Promise.all([read('hype'), read('osint')]);
const hype = await collectHype(existing, osint);
await fs.writeFile(new URL('../data/hype.json', import.meta.url), `${JSON.stringify(hype, null, 2)}\n`);
console.log(`[hype] ${hype.topics.filter((topic) => topic.status === 'ok').length}/4 Themen geladen · ${hype.history.length} Score-Snapshots`);
for (const error of hype.errors) console.warn(`[hype] ${error}`);
