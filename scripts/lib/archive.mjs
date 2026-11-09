// Append-only helpers: every collector run extends the archive instead of
// replacing it, so the full November → December history survives until the
// final archive snapshot.

/**
 * Merge two lists of objects by a key. Newer entries win for identical keys,
 * unless `combine` is given, which receives (old, fresh) and returns the merged entry.
 */
export function mergeBy(oldList = [], newList = [], keyOf, { combine, sort, limit } = {}) {
  const map = new Map();
  for (const item of Array.isArray(oldList) ? oldList : []) {
    const key = item ? keyOf(item) : null;
    if (key != null && key !== '') map.set(key, item);
  }
  for (const item of Array.isArray(newList) ? newList : []) {
    const key = item ? keyOf(item) : null;
    if (key == null || key === '') continue;
    const previous = map.get(key);
    map.set(key, previous && combine ? combine(previous, item) : item);
  }
  let merged = [...map.values()];
  if (sort) merged.sort(sort);
  if (limit) merged = merged.slice(-limit);
  return merged;
}

const byDate = (a, b) => String(a.date).localeCompare(String(b.date));

/**
 * Daily series ({date, ...}) where the latest window overwrites overlapping days.
 * Use for sources that return final values for past days (e.g. Wikipedia pageviews).
 */
export function mergeDailySeries(oldSeries, newSeries) {
  return mergeBy(oldSeries, newSeries, (point) => point.date, { sort: byDate });
}

/**
 * Daily counts taken from rolling 7-day feeds. The oldest day of a rolling
 * window is only partially covered, so keep the highest count ever observed.
 */
export function mergeDailyCounts(oldSeries, newSeries, field = 'count') {
  return mergeBy(oldSeries, newSeries, (point) => point.date, {
    sort: byDate,
    combine: (previous, fresh) => ({
      ...fresh,
      [field]: Math.max(Number(previous[field]) || 0, Number(fresh[field]) || 0),
    }),
  });
}

/** Item archive (news, posts, filings …): keeps first-seen timestamp, updates the rest. */
export function mergeItems(oldItems, newItems, keyOf, { sortKey, limit, seenAt = new Date().toISOString() } = {}) {
  const stamped = (newItems || []).map((item) => ({ ...item, firstSeen: item.firstSeen || seenAt }));
  return mergeBy(oldItems, stamped, keyOf, {
    combine: (previous, fresh) => ({ ...previous, ...fresh, firstSeen: previous.firstSeen || fresh.firstSeen }),
    sort: sortKey
      ? (a, b) => String(sortKey(a) ?? '').localeCompare(String(sortKey(b) ?? ''))
      : undefined,
    limit,
  });
}

/** Hourly snapshot timeline: one entry per UTC hour, later runs in the same hour replace it. */
export function appendTimeline(existing, snapshot, limit = 20000) {
  return mergeBy(existing, [snapshot], (entry) => String(entry.at).slice(0, 13), {
    sort: (a, b) => String(a.at).localeCompare(String(b.at)),
    limit,
  });
}
