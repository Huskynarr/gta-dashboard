# Contributing

> 🇩🇪 Beiträge auf Deutsch sind genauso willkommen — Issues und Pull Requests dürfen auf Deutsch oder Englisch geschrieben werden.

Thanks for helping improve **GTA VI Release Intelligence**! By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Setup

- Node.js **22+**, no npm dependencies (collectors use the built-in `fetch`).
- Python 3 (only for the local static server).

```bash
npm test          # unit tests (node --test)
npm run collect   # full data run → data/*.json
npm run serve     # http://localhost:4173
```

## Project structure

| Path | Purpose |
| --- | --- |
| `index.html`, `assets/` | static dashboard (no build step) |
| `assets/js/i18n.js` | DE/EN/FR translation table |
| `scripts/collect.mjs` | orchestrates all collectors |
| `scripts/lib/*.mjs` | one module per data source + `archive.mjs` merge helpers |
| `scripts/tests/` | `node --test` suites |
| `data/` | committed JSON snapshots |

## Rules

1. **Data files are bot-generated.** Do not hand-edit `data/*.json`, except the curated files `data/retail.json` and `data/stores.json` (always with a source URL).
2. **Append-only archive.** Every run must *extend* history, never replace or truncate it. Use the helpers in `scripts/lib/archive.mjs` (`mergeBy`, `mergeDailySeries`, `mergeDailyCounts`, `mergeItems`, `appendTimeline`) for any new time series or list.
3. **i18n.** Every new visible German string needs an English and French entry in `assets/js/i18n.js`.
4. **Cache busting.** When you change CSS or JS, bump the `?v=` parameter in `index.html` (and the `i18n.js` import in `app.js`).
5. **Sources.** New data sources must be public, rate-limit friendly, and documented in the README source table with their limits.
6. **No secrets** in code, workflows or data.

## Commits & versioning

We use [Conventional Commits](https://www.conventionalcommits.org/), which map to [SemVer](https://semver.org/):

| Type | Version bump |
| --- | --- |
| `feat:` | minor |
| `fix:`, `perf:` | patch |
| `feat!:` / `BREAKING CHANGE:` | major |
| `docs:`, `style:`, `ci:`, `chore:`, `test:` | none |

`chore(data):` is reserved for the automated data bot.

## Pull requests

1. Fork and branch from `main` (`feat/…`, `fix/…`).
2. Run `npm test` and check the page locally in DE, EN and FR.
3. Add an entry under **Unreleased** in [CHANGELOG.md](CHANGELOG.md).
4. Open a PR using the template; keep it focused on one change.

## Releases (maintainers)

1. Move the **Unreleased** entries in `CHANGELOG.md` to a new `## [X.Y.Z] - YYYY-MM-DD` section.
2. Set `"version": "X.Y.Z"` in `package.json`.
3. Commit: `chore(release): vX.Y.Z`.
4. Tag and push:
   ```bash
   git tag -a vX.Y.Z -m "vX.Y.Z"
   git push origin main vX.Y.Z
   ```
5. `.github/workflows/release.yml` verifies the tag against `package.json` and publishes the GitHub release with the matching changelog section.
