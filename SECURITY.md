# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| latest `main` (live site) | ✅ |
| latest release | ✅ |
| older releases | ❌ |

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Report privately via GitHub: **Security → Report a vulnerability**
<https://github.com/Huskynarr/gta-dashboard/security/advisories/new>

Please include a description, affected file/URL, steps to reproduce and the potential impact.

## Scope

- the static site (`index.html`, `assets/`) — e.g. XSS via rendered third-party data (headlines, Reddit titles, retail entries),
- the data collectors in `scripts/` — e.g. injection through fetched feeds or unsafe parsing,
- the GitHub Actions workflows running on a **self-hosted runner** — e.g. untrusted code execution, token exposure.

Out of scope: availability or accuracy of third-party sources (Yahoo, Google, Reddit, DE-CIX …), rate limiting, and findings in third-party sites.

## What to expect

- Acknowledgement within **7 days**.
- An assessment and planned fix timeline within **14 days**.
- Credit in the release notes if you wish, once a fix is published.
