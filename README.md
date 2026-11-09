# GTA VI Release Intelligence

🇬🇧 **English** · 🇩🇪 [Deutsch](README.de.md)

[![Track GTA VI signals](https://github.com/Huskynarr/gta-dashboard/actions/workflows/track.yml/badge.svg)](https://github.com/Huskynarr/gta-dashboard/actions/workflows/track.yml)
[![Live](https://img.shields.io/badge/live-huskynarr.is--a.dev-ff2e88)](https://huskynarr.is-a.dev/gta-dashboard/)
[![Release](https://img.shields.io/github/v/release/Huskynarr/gta-dashboard?sort=semver)](https://github.com/Huskynarr/gta-dashboard/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

A data-driven fan dashboard for the GTA VI release on **19 November 2026**. It brings together stock prices, sick-leave signals, OSINT hype and internet traffic at DE-CIX Frankfurt — and keeps the full history from 1 November 2026 onwards.

**Live:** <https://huskynarr.is-a.dev/gta-dashboard/>

Not financial advice. No affiliation with Rockstar Games or Take-Two. Just a fan project with too many spreadsheets.

## Features

- **Release countdown per country** — detects your country from the browser locale/time zone and shows the local preload and release time; a country picker lets you switch manually, the choice is stored in `localStorage`.
- **Market Pulse** — Take-Two, publishers, delivery and platforms as equal-weight baskets with one year of daily history.
- **Sick leave** — leading indicator from Wikipedia pageviews and Google News volume for sick notes, sick leave and incapacity to work (German terms).
- **Hype Monitor** — explained score from search interest, media coverage and Reddit, with source coverage, context, trends and a real snapshot history.
- **Topic radar** — four automatic Google News queries for retail/brands, hardware, creators/social and release/download, with 24h/7d volume, sources, headlines and sample limits.
- **Stores & merch** — filterable links to Rockstar, PlayStation, Xbox, MediaMarkt, Saturn, Rockstar merch, Netto and Edeka. Store links are also attached to the flyer finds.
- **Retail Watch** — community finds from German supermarket flyers, starting with Netto and Edeka from the thread by [@lucaslu_ckli](https://x.com/lucaslu_ckli/status/2119489167553929288). With date, original post, image links and proxy label.
- **Network Watch** — DE-CIX Frankfurt traffic (2d/7d/30d, 5-minute points), November history with daily peaks, Rockstar endpoint probe and PS5/Xbox preload countdown.
- **Peaks & records** — DE-CIX all-time peak, 2d peak, TTWO 52-week high, basket high, Wikipedia peak and top Reddit post — with real/proxy labels.
- **Investor Watch** — Take-Two IR dates, Q2 FY2027 earnings call on 9 November 2026, Yahoo consensus (EPS/revenue), SEC filings and IR press releases.
- **Vice City Prospect** — official GTA VI key art in three crops, with image credit.
- **Multilingual** — German, English and French via switcher; the choice is stored in the browser.
- **YouTube overlay** — small ad-style player bottom right with the GTA V song, muted autoplay, sound toggle and close button.
- **FAQ, timeline & methodology** — milestones, source status, data quality and deliberate limits.
- **Open data** — every JSON file in `data/` is public and extended (not replaced) on every run.

## Architecture

```
index.html               static dashboard (GitHub Pages)
assets/css/style.css     Rockstar / Vice City design
assets/js/charts.js      SVG charts, sparklines, gauge, tooltips
assets/js/i18n.js        DE/EN/FR translations + DOM observer
assets/js/app.js         load data, compute, render
assets/js/hype.js        shared score calculation and snapshot rules
scripts/collect.mjs      orchestrates all sources
scripts/lib/stocks.mjs   Yahoo Finance chart API
scripts/lib/osint.mjs    Wikipedia, Google News, Reddit, Steam, Trends
scripts/lib/network.mjs  DE-CIX traffic API + Rockstar probe
scripts/lib/investor.mjs Take-Two IR + SEC EDGAR + Yahoo consensus
scripts/lib/hype.mjs     topic RSS and hype snapshots
scripts/lib/archive.mjs  merge helpers: every run extends the history
scripts/collect-hype.mjs update only the topic radar and hype history
data/*.json              committed snapshots
data/retail.json         manually curated community finds (no collector)
data/stores.json         manually maintained store/retailer links
data/hype.json           topic samples, daily history per topic and score history
data/timeline.json       hourly snapshots of all point-in-time values (append-only)
data/news-archive.json   all captured headlines, top Reddit posts, GTA trends
llms.txt                 summary + data sources for LLMs / answer engines
.github/workflows/       cron, release and (disabled) Pages deploy
```

There is no build step. GitHub Pages serves the repository as a static site.

## Cron job

**Active: GitHub Actions on a self-hosted runner.**

`.github/workflows/track.yml` runs on the runner `gta-dashboard-local`:

- **daily at 06:00 and 18:00 UTC** — one morning and one evening snapshot,
- **hourly from 10 to 22 November 2026** — preload/release window,
- manually via `workflow_dispatch`.

Each run writes `data/stocks.json`, `data/osint.json`, `data/network.json`, `data/decix-history.json`, `data/investor.json`, `data/hype.json`, `data/timeline.json`, `data/news-archive.json` and `data/meta.json`, updates `lastmod` in `sitemap.xml`, commits only on changes and pushes to `main`. The push triggers the classic Pages branch build.

The former local data cron is disabled to avoid double runs. `scripts/cron.sh` remains as a manual fallback.

### History instead of overwrite

For the archive in mid-December 2026, the history from 1 November is continued without gaps:

| Data | Behaviour |
| --- | --- |
| Stocks | daily history merged; one price snapshot per UTC hour (up to 5000) |
| DE-CIX | 5-minute points since 1 November merged (up to 60,000 ≈ 200 days) |
| Wikipedia | daily series kept beyond the 90-day API window |
| Google News / hype topics | `history`: daily counts of all observed days (maximum per day) |
| Headlines, Reddit, Trends | `news-archive.json`, deduplicated, with `firstSeen` |
| Take-Two IR / SEC | press releases and filings are added, never removed |
| Point-in-time values (Reddit, Steam, Trends, Rockstar, DE-CIX meta, hype score) | `timeline.json`, one snapshot per UTC hour; `null` = source unavailable in that run |

## Run locally

```bash
node scripts/collect.mjs
npm run serve
# http://localhost:4173
```

Node 22 or newer is required. There are no npm dependencies; the collectors use Node's built-in `fetch`.

`npm test` checks score calculation, stale/missing sources, snapshot deduplication and RSS error handling. `npm run collect:hype` refreshes only the topic radar and extends the history from the existing OSINT data. New OSINT measurements come from the full run with `npm run collect`.

## Data sources

| Source | Usage | Limit |
| --- | --- | --- |
| Yahoo Finance chart API | daily prices, 1 year history, snapshots | unofficial API, rate limits possible |
| Wikipedia Pageviews API | GTA VI, sick leave, incapacity to work | search interest, not actual sick notes |
| Google News RSS | article volume and headlines | max. 100 results per query |
| Reddit / Arctic Shift | r/GTA6 members, posts per hour, top posts | 100-post sample, no complete 7-day count |
| Steam Web API | GTA V concurrent players | GTA VI is not on Steam (as of now) |
| Google Trends RSS | DE/US trending searches | daily trending list only, no time series |
| X / @lucaslu_ckli | community finds for Netto and Edeka, posts from 8 November 2026 | retailer attribution and flyers not independently verified; no sales data |
| DE-CIX traffic API | Frankfurt traffic, 2 days live + November archive (5-minute points) | public statistics, no availability guarantee |
| Rockstar / PlayStation | endpoint status, preload confirmation | latency is not traffic |
| Take-Two IR | earnings date, webcast, annual meeting, press releases | official dates, no guarantee |
| SEC EDGAR | 10-Q, 10-K, 8-K, DEF 14A | real filings, published with delay |
| Yahoo Finance quoteSummary | consensus EPS and revenue for Q2 FY2027 | analyst estimate, no guarantee |
| Rockstar Games / PlayStation Blog | GTA VI key art for the gallery | artwork © Rockstar Games |

## Maintaining Retail Watch

The list of finds lives in `data/retail.json` and is maintained by hand. `reviewedAt` is the date of the last editorial review; `entries` holds one item per find with a unique `id`, `retailer`, an attributed `summary`, `publishedAt` and `source` with `label` and original `url`. `images` optionally links to the images shared by the author.

Add new finds with a source and update `reviewedAt` after reviewing. The data collector never overwrites this file. There is no automatic X query and no influence on the hype score. Images are only opened via the expandable source links, not fetched on page load.

Retailer attribution comes from the community posts. Authenticity of the flyers, official partnerships, regional validity and prices are not independently checked.

With `storeId` a find can reference an entry in `data/stores.json`. Its `entries` contain `id`, `name`, `category` (`games`, `merch`, `everyday`), `kind`, `description`, `url`, `action` and `verification`. `checked` means the page was fetched successfully when added; `blocked` marks a blocked automatic fetch. The list is not checked automatically for prices or availability and contains no affiliate links.

## Hype analysis and limits

The hype score uses the same calculation in the browser and in the collector: Wikipedia 45 %, English news 35 %, Reddit 20 %. The exact formula is expandable in the dashboard. Missing, broken or stale (> 48 h) sources are excluded and the remaining weights are renormalised. A measured zero remains a measurement. The score measures attention, not sentiment or purchase intent.

`data/hype.json` stores at most one score per hour based on the actual OSINT timestamp. No historical scores are invented. The chart only uses complete snapshots of the same formula version and source base. After changing the formula, `HYPE_VERSION` must be bumped.

The topic radar queries four Google News RSS searches in parallel, removes duplicate links/identical titles, invalid URLs and articles outside the seven-day window. Google returns at most 100 results per query; capped samples are flagged and get no momentum comparison. Topics may overlap and are not market shares.

On errors, the last successful topic state stays visible with its original timestamp and is marked stale. A valid empty RSS response means zero results; an HTML error page counts as a source failure. Store sales, wishlists, YouTube views and TikTok/Twitch reach are not collected.

## Optimisations

- **Smaller live data:** `network.json` shrinks from ~737 KB to ~47 KB; the November history lives separately in `decix-history.json`.
- **Monthly peaks:** DE-CIX history is merged daily, with daily peaks and the November peak; 2d/7d/30d switch in the chart.
- **Preload clarity:** PS5 and Xbox preload are separate timeline steps and platform badges.
- **Retries:** all HTTP sources get 3 attempts with backoff; 4xx except 429 are not retried.
- **Mobile performance:** grain, sun animation and expensive backdrop filters are reduced on small screens.
- **Data quality:** every metric is labelled `Real`, `Proxy` or `Leading`.
- **Cache busting:** version parameter on CSS/JS prevents stale Cloudflare/Pages caches after deploys.
- **SEO / GEO:** canonical, Open Graph/Twitter meta, JSON-LD (`WebSite`, `VideoGame`, `Dataset` with downloads, `FAQPage`), visible FAQ, `llms.txt`, AI crawlers explicitly allowed in `robots.txt`, `sitemap.xml` with automatic `lastmod` and web manifest.
- **Resilience:** if a source fails, the last data stays visible and the source status becomes `degraded`.

## Important limits

- **Sick leave:** official health-insurance data is published weeks later. The dashboard therefore uses search and news signals as a leading indicator — not as official statistics.
- **Stocks:** equal-weight baskets are not investment products. The selection is deliberately subjective and meant for visualisation, not prediction.
- **DE-CIX:** the traffic shown is the total traffic of the Frankfurt internet exchange, not isolated GTA VI traffic. A rise on preload day is a plausible, not a causal signal.
- **Reddit:** Arctic Shift provides a sample of the latest 100 posts. "Posts per hour" is a rate, not a complete daily count.

## Deployment

1. The repository is public: `Huskynarr/gta-dashboard`.
2. GitHub Pages is set to **Deploy from a branch**: `main` / `/` (root).
3. Live: <https://huskynarr.is-a.dev/gta-dashboard/>.

An Actions-based deploy is available as `.github/workflows/deploy.yml.disabled`; it currently fails on the self-hosted runner because the GitHub artifact storage quota is exhausted. Once the quota is free: rename to `deploy.yml`, switch the Pages source to **GitHub Actions** and push.

## Versioning & releases

The project follows [Semantic Versioning](https://semver.org/). Changes are documented in [CHANGELOG.md](CHANGELOG.md); pushing a tag `vX.Y.Z` that matches `package.json` creates a GitHub release via `.github/workflows/release.yml`. Automated data commits (`chore(data)`) do not create versions.

## Contributing

Contributions are welcome — in English or German. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md). Security issues: see [SECURITY.md](SECURITY.md).

## License

Code: [MIT](LICENSE). Data and trademarks belong to their respective owners. GTA, Grand Theft Auto and Rockstar Games are trademarks of Take-Two Interactive.
