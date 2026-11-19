# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Automated data refreshes (`chore(data)`) are not listed.

## [Unreleased]

### Added
- AMS-IX Amsterdam and LONAP London in the network comparison chart (now six exchanges). AMS-IX is read from the Apollo state embedded in its statistics page, LONAP from its public IXP Manager grapher. Both are backfilled to 1 November from their coarser monthly series (AMS-IX 2 h, LONAP up to 30 min), which also closes gaps after collector outages without overwriting finer points. Data in `data/ixp-sites.json`; hourly snapshots in `timeline.json` include `ixpSites`. Their 100 % reference is the published 12-month peak.
- Network Watch compares DE-CIX Frankfurt with New York, Madrid and Dubai (same DE-CIX traffic API). Each site is shown as a percentage of its own all-time peak, so the PS5 preload wave through the time zones and the simultaneous Xbox start at 00:00 GMT become visible.
- `data/decix-sites.json`: append-only 5-minute history since 1 November 2026 plus daily peaks for the additional sites; hourly snapshots in `timeline.json` include their live values (`decixSites`).

- More search terms: Google News query `lore` for Leonida/Vice City (combined with GTA), Wikipedia pageviews for GTA VI (FR), the GTA series, GTA V and Rockstar Games (new "Around GTA VI" chart), and r/GTA next to r/GTA6 (`osint.redditGta`, archived in `news-archive.json` and `timeline.json`).

### Changed
- The GTA VI Google News queries now also match "GTA VI". The 7-day count was already capped at 100; the 24-hour count, which feeds the hype score's media channel, may rise slightly from 10 November 2026.

- Error monitoring with the self-hosted Sentry (`logging.gardenpiratez.de`): the frontend (index and 404 page) uses the lazy Sentry loader on the live domain only, without replay, tracing or personal data; the collector reports crashes and source warnings (`meta.errors`, grouped per source) through a dependency-free envelope client. DSN for the collector via the `SENTRY_DSN_COLLECTOR` secret.

### Changed (mobile)
Audited with Lighthouse in its mobile profile (Moto G Power, slow 4G). Measured on a gzip server against the previous version: page weight 2.3 MB → 543 KB, Best Practices 96 → 100, CLS ≤ 0.04, hero visible before the data arrives.
- The YouTube popup no longer opens by itself on phones (≤ 620 px). It covered a third of the first screen (an intrusive interstitial) and loaded ~1.5 MB of player code; it is now one tap away via the "AD" button. On desktop it appears only after the page has loaded.
- The hero no longer waits for JavaScript and data: its entrance is pure CSS and the countdown renders before the JSON files load.
- Sections render one after another with yields to the main thread instead of one long task; the exchange comparison (`decix-sites.json`, `ixp-sites.json`, the largest payload) loads after the first render.
- Data files are revalidated (`cache: 'no-cache'`, ETag) instead of always being downloaded again (`no-store`).
- Metric-matched fallback fonts (`size-adjust`) prevent layout shifts when Anton and Barlow Condensed swap in.
- Phones: labels have at least 11 px, chart axes 11 px, the language buttons, menu, popup controls and footer links have larger tap targets, and the full-screen noise blend layer is disabled.
- Key art is served as WebP (132 KB instead of 200 KB) with a JPEG fallback.

### Fixed
- Reddit collection retries Arctic Shift's sporadic HTTP 422 "Timeout. Maybe slow down a bit" instead of marking the source degraded.
- `2T`/`7T` range buttons are now translated to `2D`/`7D` (EN) and `2J`/`7J` (FR).

## [1.6.0] - 2026-11-09

### Added
- Countdown shows a secondary release countdown (local midnight in the selected country) below the preload countdown; after the preload it becomes the main countdown.

## [1.5.1] - 2026-11-09

### Added
- `scripts/backfill-archive.mjs` (`npm run backfill`): rebuilds `timeline.json`, `news-archive.json` and the merged daily histories from every data snapshot in git history (idempotent).

### Changed
- Archive merge logic moved from `collect.mjs` into `scripts/lib/archive.mjs` (`extendArchives`); existing `history` arrays are always carried over.

## [1.5.0] - 2026-11-09

### Added
- Release countdown per country: auto-detected from browser locale/time zone, manual country picker, choice stored in `localStorage`.
- Append-only archive: `data/timeline.json` (hourly snapshots of all point-in-time signals) and `data/news-archive.json` (all captured headlines, top Reddit posts and GTA trends with `firstSeen`).
- `scripts/lib/archive.mjs` merge helpers.
- SEO/GEO/LLM optimisation: JSON-LD (`WebSite`, `VideoGame`, `Dataset` with downloads, `FAQPage`), visible FAQ (DE/EN/FR), `llms.txt`, AI crawlers explicitly allowed in `robots.txt`, automatic `lastmod` in `sitemap.xml`, `noindex` on the 404 page.
- Methodology card "Archive".
- English README, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md`, issue forms, pull request template, this changelog and a tag-based release workflow.

### Changed
- Every collector run now extends history instead of replacing it: Wikipedia series beyond the 90-day API window, daily Google News and hype-topic counts (`history`), Take-Two press releases and SEC filings are merged.
- Stock snapshots are stored per UTC hour (up to 5000) instead of per morning/evening slot.
- DE-CIX history limit raised to 60,000 five-minute points.
- German README moved to `README.de.md`; `README.md` is now English.

## [1.4.0] - 2026-11-09

### Added
- German, English and French interface with language switcher.
- YouTube ad-style overlay with the GTA V song.

## [1.3.1] - 2026-11-09

### Fixed
- Fallback for Arctic Shift deployments that reject the `fields` parameter.

## [1.3.0] - 2026-11-09

### Added
- November DE-CIX archive with daily peaks (`data/decix-history.json`).
- Separate Xbox preload date and platform badges.
- Key-art gallery "Vice City Prospect".

## [1.2.0] - 2026-11-09

### Added
- Explained hype score with snapshot history and topic radar.
- Store directory (Stores & Merch) and Retail Watch community finds.

## [1.1.0] - 2026-11-08

### Added
- Peaks & records section and peak values in the hero stats.
- Investor Watch (Take-Two IR, SEC EDGAR, consensus estimates).

### Changed
- Performance optimisations and cache-busting of dashboard assets.
- Tracking cron runs on a self-hosted GitHub Actions runner.

## [1.0.0] - 2026-11-08

### Added
- Initial GTA VI Release Intelligence dashboard: market pulse, sick-leave signals, OSINT, DE-CIX network watch, timeline and methodology.
- Scheduled data collection and GitHub Pages deployment.

[Unreleased]: https://github.com/Huskynarr/gta-dashboard/compare/v1.6.0...HEAD
[1.6.0]: https://github.com/Huskynarr/gta-dashboard/compare/v1.5.1...v1.6.0
[1.5.1]: https://github.com/Huskynarr/gta-dashboard/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/Huskynarr/gta-dashboard/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/Huskynarr/gta-dashboard/compare/v1.3.1...v1.4.0
[1.3.1]: https://github.com/Huskynarr/gta-dashboard/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/Huskynarr/gta-dashboard/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/Huskynarr/gta-dashboard/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Huskynarr/gta-dashboard/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Huskynarr/gta-dashboard/releases/tag/v1.0.0
