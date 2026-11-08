# GTA VI Release Intelligence

Ein datengetriebenes Fan-Dashboard zum GTA-VI-Release am **19. November 2026**. Es verbindet Aktienkurse, Krankenstand-Signale, OSINT-Hype und den Netzwerk-Traffic am DE-CIX Frankfurt.

**Live:** <https://huskynarr.is-a.dev/gta-dashboard/>

Kein Finanzrat. Keine Verbindung zu Rockstar Games oder Take-Two. Nur ein Fan-Projekt mit zu vielen Tabellen.

## Was drin ist

- **Market Pulse** — Take-Two, Publisher, Delivery und Plattformen als Equal-Weight-Baskets mit einem Jahr Tageshistorie.
- **Krankenstand** — Leading Indicator aus Wikipedia-Pageviews und Google-News-Volumen für Krankmeldung, Krankenstand und Arbeitsunfähigkeit.
- **Hype & OSINT** — Wikipedia, Google News, Reddit (Arctic Shift), Steam und Google Trends.
- **Network Watch** — DE-CIX-Frankfurt-Traffic (2 Tage, 5-Minuten-Punkte), Rockstar-Endpoint-Probe und Preload-Countdown.
- **Timeline & Methodik** — Meilensteine, Quellenstatus und bewusste Grenzen der Daten.

## Architektur

```
index.html               statisches Dashboard (GitHub Pages)
assets/css/style.css     Rockstar-/Vice-City-Design
assets/js/charts.js      SVG-Charts, Sparklines, Gauge, Tooltips
assets/js/app.js         Daten laden, berechnen, rendern
scripts/collect.mjs      Orchestriert alle Quellen
scripts/lib/stocks.mjs    Yahoo Finance Chart API
scripts/lib/osint.mjs     Wikipedia, Google News, Reddit, Steam, Trends
scripts/lib/network.mjs   DE-CIX Traffic API + Rockstar-Probe
data/*.json              committete Momentaufnahmen
.github/workflows/       Cron + GitHub-Pages-Deploy
```

Es gibt keinen Build-Schritt. GitHub Pages liefert das Repository als statische Seite aus; der Deploy-Workflow kopiert nur die nötigen Dateien nach `_site/`.

## Cronjob

**Aktiv: GitHub Actions auf Self-hosted Runner.**

`.github/workflows/track.yml` läuft auf dem Runner `gta-dashboard-local`:

- **täglich um 06:00 und 18:00 UTC** — morgens und abends ein Snapshot,
- **stündlich vom 10. bis 22. November 2026** — Preload-/Release-Fenster,
- manuell über `workflow_dispatch`.

Jeder Lauf schreibt `data/stocks.json`, `data/osint.json`, `data/network.json` und `data/meta.json`, committet nur bei Änderungen und pusht auf `main`. Der Push triggert den klassischen Pages-Branch-Build.

Runner-Verzeichnis: `/home/huskynarr/gta-dashboard-runner`.  
Runner-Log: `/home/huskynarr/gta-dashboard-runner/runner.log`.  
Watchdog-Cron startet den Runner nach Reboot und prüft alle 5 Minuten, ob er noch läuft.

Der frühere lokale Daten-Cron ist deaktiviert, damit es keine Doppel-Läufe gibt. `scripts/cron.sh` bleibt als manueller Fallback erhalten.

## Lokal starten

```bash
node scripts/collect.mjs
python3 -m http.server 4173
# http://localhost:4173
```

Node 22 oder neuer wird benötigt. Es gibt keine npm-Abhängigkeiten; die Collector-Skripte nutzen `fetch` aus Node.

## Datenquellen

| Quelle | Nutzung | Grenze |
| --- | --- | --- |
| Yahoo Finance Chart API | Tageskurse, 1 Jahr Historie, Snapshots | inoffizielle API, Rate-Limits möglich |
| Wikipedia Pageviews API | GTA VI, Krankenstand, Arbeitsunfähigkeit | Suchinteresse, keine echten Krankmeldungen |
| Google News RSS | Artikelvolumen und Schlagzeilen | max. 100 Treffer pro Query |
| Reddit / Arctic Shift | r/GTA6 Members, Posts pro Stunde, Top-Posts | 100-Post-Sample, kein vollständiger 7-Tage-Count |
| Steam Web API | GTA V Concurrent Players | GTA VI ist (Stand jetzt) nicht auf Steam |
| Google Trends RSS | DE/US Trending Searches | nur tägliche Trending-Liste, keine Zeitreihe |
| DE-CIX Traffic API | Frankfurt Traffic, 2 Tage / 1 Monat | öffentliche Statistik, keine Garantie auf Verfügbarkeit |
| Rockstar / PlayStation | Endpoint-Status, Preload-Bestätigung | Latenz ist kein Traffic |

## Wichtige Grenzen

- **Krankenstand**: Offizielle Krankenkassen-Daten erscheinen mit Wochen Verzug. Das Dashboard nutzt deshalb Such- und News-Signale als Leading Indicator — nicht als amtliche Krankheitsstatistik.
- **Aktien**: Equal-Weight-Baskets sind keine Anlageprodukte. Die Auswahl ist bewusst subjektiv und dient der Visualisierung, nicht der Prognose.
- **DE-CIX**: Der angezeigte Traffic ist der Gesamtverkehr des Frankfurter Internet-Knotens, nicht isolierter GTA-VI-Traffic. Ein Anstieg am Preload-Tag ist ein plausibles, aber kein kausales Signal.
- **Reddit**: Arctic Shift liefert ein Sample der letzten 100 Posts. `Posts pro Stunde` ist eine Rate, kein vollständiger Tages-Count.

## Deployment

1. Repository ist öffentlich: `Huskynarr/gta-dashboard`.
2. GitHub Pages ist auf **Deploy from a branch** gestellt: `main` / `/` (root).
3. Live: <https://huskynarr.is-a.dev/gta-dashboard/>.

Der Actions-Deploy liegt als `.github/workflows/deploy.yml.disabled` bereit. Ein Testlauf auf dem Self-hosted Runner scheitert aktuell an der GitHub-Artefakt-Storage-Quote:

> `Failed to CreateArtifact: Artifact storage quota has been hit.`

Deshalb bleibt die Veröffentlichung beim klassischen Pages-Branch-Build. Der **Track-Cron läuft trotzdem über GitHub Actions** auf dem Self-hosted Runner und pusht die Daten; der Branch-Build deployt sie. Sobald die Artefakt-Quote wieder frei ist: `deploy.yml.disabled` → `deploy.yml`, Pages-Source auf **GitHub Actions** stellen, pushen.

Die Custom Domain `huskynarr.is-a.dev` wird vom User-Site-Repository bereitgestellt; das Projekt-Repository braucht keine eigene `CNAME`-Datei.

## Lizenz

Code: MIT. Daten und Marken gehören ihren jeweiligen Rechteinhabern. GTA, Grand Theft Auto und Rockstar Games sind Marken von Take-Two Interactive.
