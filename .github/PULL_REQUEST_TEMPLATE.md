## Summary

<!-- What does this PR change and why? Link issues with "Closes #123". -->

## Type

- [ ] `feat` – new feature (minor)
- [ ] `fix` / `perf` – bug fix or performance (patch)
- [ ] `docs` / `style` / `ci` / `chore` / `test` – no release
- [ ] Breaking change (major)

## Checklist

- [ ] PR title follows [Conventional Commits](https://www.conventionalcommits.org/)
- [ ] `npm test` passes
- [ ] Checked locally (`npm run serve`) in **DE, EN and FR**
- [ ] New visible strings have EN + FR entries in `assets/js/i18n.js`
- [ ] Bumped the `?v=` cache-busting parameter if CSS/JS changed
- [ ] No data loss: archives/histories are extended, not replaced (`scripts/lib/archive.mjs`)
- [ ] No hand edits to bot-generated `data/*.json` (except `retail.json` / `stores.json`)
- [ ] Entry added under **Unreleased** in `CHANGELOG.md`
- [ ] README (EN + DE) updated if behaviour or data files changed

## Screenshots

<!-- For UI changes: before / after, desktop and mobile. -->
