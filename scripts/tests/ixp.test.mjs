import test from 'node:test';
import assert from 'node:assert/strict';
import { fillGaps, parseAmsix, parseIxpManagerLog } from '../lib/ixp.mjs';

const amsixHtml = (state) =>
  `<html><script>window.__APOLLO_STATE__ = ${JSON.stringify(state)};window.other = {"a":"}"};</script></html>`;

const graph = (id, interval, peakIn, currentIn, rows) => ({
  [`g${id}`]: {
    __typename: 'graph_Entry',
    interval,
    peakIn,
    currentIn,
    averageInputData: rows.map((_, index) => ({ id: `g${id}.row${index}` })),
  },
  ...Object.fromEntries(rows.map(([time, value], index) => [`g${id}.row${index}`, { time, value }])),
});

test('parseAmsix reads the embedded Apollo state and converts Mbit/s to bit/s', () => {
  const html = amsixHtml({
    ...graph(1, 'daily', 14000000, 13000000, [[1794248700, 13172925.5], [1794249000, 13100000]]),
    ...graph(2, 'monthly', 15800000, 13000000, [[1791396000, 12034778.2]]),
    unrelated: { __typename: 'graph_Entry' },
    text: { body: 'braces } and "quotes" inside strings' },
  });
  const graphs = parseAmsix(html);
  assert.deepEqual(graphs.daily.points[0], { clock: 1794248700000, value: 13172925500000 });
  assert.equal(graphs.daily.points.length, 2);
  assert.equal(graphs.monthly.peak, 15.8e12);
  assert.equal(graphs.daily.current, 13e12);
});

test('parseAmsix fails loudly when the page layout changes', () => {
  assert.throws(() => parseAmsix('<html>no state</html>'), /__APOLLO_STATE__/);
  assert.throws(() => parseAmsix(amsixHtml({ ...graph(2, 'monthly', 1, 1, [[1, 1]]) })), /daily/);
});

test('parseIxpManagerLog keeps aligned rows, uses average inbound bit/s and sorts', () => {
  const rows = [
    [1794421506, 9, 9, 9, 9], // unaligned "now" sample
    [1794301800, 2408333342624, 2409310370568, 2411447555512, 2412321098672],
    [1794301500, 2400000000000, 0, 0, 0],
    'garbage',
  ];
  assert.deepEqual(parseIxpManagerLog(rows), [
    { clock: 1794301500000, value: 2400000000000 },
    { clock: 1794301800000, value: 2408333342624 },
  ]);
});

test('fillGaps only adds coarse points before the history or inside a gap', () => {
  const coarse = [1, 2, 5, 8, 11].map((clock) => ({ clock, value: clock }));
  const fine = [{ clock: 10, value: 0 }];
  // Empty history: everything older than the fine window.
  assert.deepEqual(fillGaps([], coarse, fine).map((p) => p.clock), [1, 2, 5, 8]);
  // History covers 3..6: keep older points and the gap 6..10, never overwrite 5.
  assert.deepEqual(fillGaps([[3, 0], [6, 0]], coarse, fine).map((p) => p.clock), [1, 2, 8]);
});
