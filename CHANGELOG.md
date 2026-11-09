# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Automated data refreshes (`chore(data)`) are not listed.

## [Unreleased]

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
