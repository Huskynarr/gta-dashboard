# GTA VI Release Intelligence

🇬🇧 [English](README.md) · 🇩🇪 **Deutsch**

[![Track GTA VI signals](https://github.com/Huskynarr/gta-dashboard/actions/workflows/track.yml/badge.svg)](https://github.com/Huskynarr/gta-dashboard/actions/workflows/track.yml)
[![Live](https://img.shields.io/badge/live-huskynarr.is--a.dev-ff2e88)](https://huskynarr.is-a.dev/gta-dashboard/)

Ein datengetriebenes Fan-Dashboard zum GTA-VI-Release am **19. November 2026**. Es verbindet Aktienkurse, Krankenstand-Signale, OSINT-Hype und den Netzwerk-Traffic am DE-CIX Frankfurt.

**Live:** <https://huskynarr.is-a.dev/gta-dashboard/>

Kein Finanzrat. Keine Verbindung zu Rockstar Games oder Take-Two. Nur ein Fan-Projekt mit zu vielen Tabellen.

## Was drin ist

- **Release-Countdown pro Land** — erkennt das Land anhand von Browser-Sprache/Zeitzone und zeigt Preload und Release in Ortszeit; per Länderauswahl manuell umstellbar, die Wahl wird in `localStorage` gespeichert.
- **Market Pulse** — Take-Two, Publisher, Delivery und Plattformen als Equal-Weight-Baskets mit einem Jahr Tageshistorie.
- **Krankenstand** — Leading Indicator aus Wikipedia-Pageviews und Google-News-Volumen für Krankmeldung, Krankenstand und Arbeitsunfähigkeit.
- **Hype Monitor** — erklärter Score aus Suchinteresse, Medienecho und Reddit, mit Quellenabdeckung, Einordnung, Trends-Kontext und echtem Snapshot-Verlauf.
- **Themenradar** — vier automatische Google-News-Abfragen für Handel/Marken, Hardware, Creator/Social und Release/Download. Mit 24h-/7T-Volumen, Quellen, Schlagzeilen und Sample-Grenzen.
- **Stores & Merch** — filterbare Links zu Rockstar, PlayStation, Xbox, MediaMarkt, Saturn, Rockstar-Merch, Netto und Edeka. Store-Links sind auch direkt an den Prospekt-Funden verfügbar.
- **Retail Watch** — Community-Funde aus Supermarktprospekten im OSINT-Bereich, zunächst Netto und Edeka aus dem Thread von [@lucaslu_ckli](https://x.com/lucaslu_ckli/status/2119489167553929288). Mit Datum, Originalbeitrag, Bildlinks und Proxy-Kennzeichnung.
- **Network Watch** — DE-CIX-Frankfurt-Traffic (2T/7T/30T, 5-Minuten-Punkte), November-Historie mit Tages-Peaks, Rockstar-Endpoint-Probe und PS5-/Xbox-Preload-Countdown.
- **Peaks & Records** — DE-CIX-All-Time-Peak, 2T-Peak, TTWO-52W-Hoch, Basket-Hoch, Wikipedia-Peak und Reddit-Top-Post — mit Real/Proxy-Label.
- **Investor Watch** — Take-Two-IR-Termine, Q2-FY2027-Earnings-Call am 9. November 2026, Yahoo-Konsens (EPS/Umsatz), SEC-Filings und IR-Pressemitteilungen.
- **Vice City Prospect** — offizielles GTA-VI-Key-Art in drei Ausschnitten, mit Bildcredit.
- **Mehrsprachig** — Deutsch, English und Français per Umschalter; die Wahl bleibt im Browser gespeichert.
- **YouTube-Overlay** — kleiner Werbe-Inlayer unten rechts mit dem GTA-V-Song, stummem Autoplay, Ton-Schalter und Schließen-Button.
- **Timeline & Methodik** — Meilensteine, Quellenstatus, Datenqualität und bewusste Grenzen.

## Architektur

```
index.html               statisches Dashboard (GitHub Pages)
assets/css/style.css     Rockstar-/Vice-City-Design
assets/js/charts.js      SVG-Charts, Sparklines, Gauge, Tooltips
assets/js/i18n.js        DE/EN/FR-Übersetzungen + DOM-Observer
assets/js/app.js         Daten laden, berechnen, rendern
assets/js/hype.js        gemeinsame Score-Berechnung und Snapshot-Regeln
scripts/collect.mjs      Orchestriert alle Quellen
scripts/lib/stocks.mjs    Yahoo Finance Chart API
scripts/lib/osint.mjs     Wikipedia, Google News, Reddit, Steam, Trends
scripts/lib/network.mjs   DE-CIX Traffic API + Rockstar-Probe
scripts/lib/investor.mjs  Take-Two IR + SEC EDGAR + Yahoo-Konsens
scripts/lib/hype.mjs     Themen-RSS und Hype-Snapshots
scripts/lib/archive.mjs  Merge-Helfer: jeder Lauf erweitert den Verlauf
scripts/collect-hype.mjs  nur Themenradar und Hype-Verlauf aktualisieren
data/*.json              committete Momentaufnahmen
data/retail.json         manuell kuratierte Community-Funde (kein Collector)
data/stores.json         manuell gepflegte Store-/Händlerlinks
data/hype.json           Themen-Samples, Tageshistorie je Thema und Score-Verlauf
data/timeline.json       stündliche Snapshots aller Momentwerte (append-only)
data/news-archive.json   alle erfassten Schlagzeilen, Reddit-Top-Posts, GTA-Trends
llms.txt                 Zusammenfassung + Datenquellen für LLMs / Answer Engines
.github/workflows/       Cron + GitHub-Pages-Deploy
```

Es gibt keinen Build-Schritt. GitHub Pages liefert das Repository als statische Seite aus; der Deploy-Workflow kopiert nur die nötigen Dateien nach `_site/`.

## Cronjob

**Aktiv: GitHub Actions auf Self-hosted Runner.**

`.github/workflows/track.yml` läuft auf dem Runner `gta-dashboard-local`:

- **täglich um 06:00 und 18:00 UTC** — morgens und abends ein Snapshot,
- **stündlich vom 10. bis 22. November 2026** — Preload-/Release-Fenster,
- manuell über `workflow_dispatch`.

Jeder Lauf schreibt `data/stocks.json`, `data/osint.json`, `data/network.json`, `data/decix-history.json`, `data/investor.json`, `data/hype.json`, `data/timeline.json`, `data/news-archive.json` und `data/meta.json`, aktualisiert `lastmod` in `sitemap.xml`, committet nur bei Änderungen und pusht auf `main`. Der Push triggert den klassischen Pages-Branch-Build.

### Verlauf statt Überschreiben

Für die Archivierung Mitte Dezember 2026 wird der Verlauf ab 1. November lückenlos fortgeschrieben:

| Daten | Verhalten |
| --- | --- |
| Aktien | Tageshistorie gemerged; ein Kurs-Snapshot pro UTC-Stunde (bis 5000) |
| DE-CIX | 5-Minuten-Punkte seit 1. November gemerged (bis 60.000 ≈ 200 Tage) |
| Wikipedia | Tagesreihen über das 90-Tage-API-Fenster hinaus behalten |
| Google News / Hype-Themen | `history`: Tageszähler aller beobachteten Tage (Maximum je Tag) |
| Schlagzeilen, Reddit, Trends | `news-archive.json`, dedupliziert, mit `firstSeen` |
| Take-Two IR / SEC | Pressemitteilungen und Filings werden ergänzt, nie entfernt |
| Momentwerte (Reddit, Steam, Trends, Rockstar, DE-CIX-Meta, Hype-Score) | `timeline.json`, ein Snapshot pro UTC-Stunde; `null` = Quelle in dem Lauf nicht verfügbar |

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

`npm test` prüft Score-Berechnung, veraltete/fehlende Quellen, Snapshot-Deduplizierung und RSS-Fehlerbehandlung. `npm run collect:hype` aktualisiert nur den Themenradar und ergänzt den Verlauf aus dem vorhandenen OSINT-Datenstand. Neue OSINT-Messungen erzeugt der vollständige Lauf mit `npm run collect`.

## Datenquellen

| Quelle | Nutzung | Grenze |
| --- | --- | --- |
| Yahoo Finance Chart API | Tageskurse, 1 Jahr Historie, Snapshots | inoffizielle API, Rate-Limits möglich |
| Wikipedia Pageviews API | GTA VI, Krankenstand, Arbeitsunfähigkeit | Suchinteresse, keine echten Krankmeldungen |
| Google News RSS | Artikelvolumen und Schlagzeilen | max. 100 Treffer pro Query |
| Reddit / Arctic Shift | r/GTA6 Members, Posts pro Stunde, Top-Posts | 100-Post-Sample, kein vollständiger 7-Tage-Count |
| Steam Web API | GTA V Concurrent Players | GTA VI ist (Stand jetzt) nicht auf Steam |
| Google Trends RSS | DE/US Trending Searches | nur tägliche Trending-Liste, keine Zeitreihe |
| X / @lucaslu_ckli | Community-Funde zu Netto und Edeka, Beiträge vom 8. November 2026 | Händlerzuordnung und Prospekte nicht unabhängig bestätigt; keine Umsatzdaten |
| DE-CIX Traffic API | Frankfurt Traffic, 2 Tage live + November-Archiv (5-Minuten-Punkte) | öffentliche Statistik, keine Garantie auf Verfügbarkeit |
| Rockstar / PlayStation | Endpoint-Status, Preload-Bestätigung | Latenz ist kein Traffic |
| Take-Two IR | Earnings-Termin, Webcast, Annual Meeting, Pressemitteilungen | offizielle Termine, keine Garantie auf Umsetzung |
| SEC EDGAR | 10-Q, 10-K, 8-K, DEF 14A | echte Filings, Veröffentlichung mit Verzug |
| Yahoo Finance quoteSummary | Konsens-EPS und -Umsatz für Q2 FY2027 | Analystenschätzung, keine Garantie |
| Rockstar Games / PlayStation Blog | GTA-VI-Key-Art für die Galerie | Bildmaterial © Rockstar Games |

## Retail Watch pflegen

Die Fundliste liegt in `data/retail.json` und wird manuell gepflegt. `reviewedAt` ist das Datum der letzten redaktionellen Sichtung; `entries` enthält je Fund eine eindeutige `id`, `retailer`, eine zugeschriebene `summary`, `publishedAt` sowie `source` mit `label` und Original-`url`. `images` enthält optional Links zu den vom Autor geteilten Bildern.

Neue Funde mit Quelle ergänzen und `reviewedAt` nach der Sichtung aktualisieren. Der Daten-Collector überschreibt diese Datei nicht. Es gibt keine automatische X-Abfrage und keinen Einfluss auf den Hype-Score. Bilder werden erst über die aufklappbaren Quellenlinks geöffnet, nicht beim Laden des Dashboards abgerufen.

Die Händlerzuordnung stammt aus den Community-Beiträgen. Echtheit der Prospekte, offizielle Kooperationen, regionale Gültigkeit und Preise sind nicht unabhängig geprüft. Die Fundliste misst weder Umsatz noch Marktanteile oder die Anzahl aller Händler mit GTA-Bezug.

Mit `storeId` verweist ein Fund optional auf einen Eintrag in `data/stores.json`. Dessen `entries` enthalten `id`, `name`, `category` (`games`, `merch`, `everyday`), `kind`, `description`, `url`, `action` und `verification`. `checked` bedeutet, dass die Seite beim Eintragen erfolgreich abgerufen wurde; `blocked` kennzeichnet einen blockierten automatischen Abruf. Das Datum steht in `reviewedAt`. Diese Liste wird nicht automatisch auf Preise oder Verfügbarkeit geprüft und enthält keine Affiliate-Links.

## Hype-Analyse und Grenzen

Der Hype-Score nutzt dieselbe Berechnung im Browser und im Collector: Wikipedia 45 %, englische News 35 %, Reddit 20 %. Die genaue Formel steht aufklappbar im Dashboard. Fehlende, fehlerhafte oder über 48 Stunden alte Quellen werden ausgeschlossen; verbleibende Gewichte werden neu verteilt. Ein gemessener Nullwert bleibt ein Messwert. Der Score misst Aufmerksamkeit, weder Stimmung noch Kaufabsicht.

`data/hype.json` speichert höchstens einen Score pro Stunde anhand des tatsächlichen OSINT-Zeitstempels und hält bis zu 90 Tage vor. Es werden keine historischen Scores erfunden. Der Chart nutzt nur vollständige Snapshots derselben Formelversion und Quellenbasis; Veränderungen werden ebenfalls nur auf gleicher Quellenbasis verglichen. Nach Änderungen an der Formel muss `HYPE_VERSION` erhöht werden.

Der Themenradar fragt vier Google-News-RSS-Suchen parallel ab. Er entfernt doppelte Links/identische Titel, ungültige URLs und Artikel außerhalb des Sieben-Tage-Fensters. Die Tages-Sparklines zeigen sieben UTC-Kalendertage; der 7T-Gesamtwert verwendet ein rollendes Sieben-Tage-Fenster. Google liefert höchstens 100 Ergebnisse je Abfrage; gedeckelte Samples werden markiert und bekommen keinen Momentumvergleich. Themen dürfen sich überschneiden und sind keine Marktanteile. Der 24h-Vergleich verwendet den Tagesdurchschnitt desselben 7T-Samples.

Bei Fehlern bleibt der letzte erfolgreiche Themenstand mit seinem ursprünglichen Zeitstempel sichtbar und wird als veraltet markiert. Eine gültige leere RSS-Antwort bedeutet null Treffer; eine HTML-Fehlerseite gilt als Quellenausfall. Öffentliche Store-Verkaufszahlen, Wunschlisten, YouTube-Aufrufe sowie TikTok-/Twitch-Reichweiten werden nicht erhoben. Die entsprechenden Themenkarten messen Berichterstattung über diese Kanäle.

## Optimierungen

- **Kleinere Live-Daten:** `network.json` sinkt von ca. 737 KB auf ca. 47 KB; die November-Historie liegt separat in `decix-history.json` (ca. 128 KB).
- **Monats-Peaks:** DE-CIX-Historie wird täglich gemerged, mit Tages-Peaks und November-Peak; 2T/7T/30T-Umschaltung im Chart.
- **Preload-Klarheit:** PS5- und Xbox-Preload sind getrennte Timeline-Schritte und Plattform-Badges.
- **Retries:** Alle HTTP-Quellen haben 3 Versuche mit Backoff; 4xx außer 429 werden nicht sinnlos wiederholt.
- **Mobile Performance:** Auf kleinen Screens werden Grain, Sun-Animation und teure Backdrop-Filter reduziert; Charts bekommen eine lesbare Höhe.
- **Weniger Doppelarbeit:** Aktien-Historien werden pro Objekt gecacht, Basket-Karten und Chart teilen sich die 30-Tage-Berechnung.
- **Datenqualität:** Jede Kennzahl ist als `Real`, `Proxy` oder `Leading` markiert.
- **Cache-Busting:** Versionsparameter an CSS/JS — verhindert stale Cloudflare-/Pages-Caches nach Deploys.
- **SEO / GEO:** Canonical, Open-Graph/Twitter-Meta, JSON-LD (`WebSite`, `VideoGame`, `Dataset` mit Downloads, `FAQPage`), sichtbare FAQ, `llms.txt`, KI-Crawler explizit erlaubt in `robots.txt`, `sitemap.xml` mit automatischem `lastmod` und Web-Manifest.
- **Resilienz:** Fehlt eine Quelle, bleiben die letzten Daten sichtbar; der Quellenstatus wird `degraded`.
- **Cron:** Der Track-Workflow läuft auf dem Self-hosted Runner; der Runner wird per Watchdog am Leben gehalten.

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

## Versionierung & Releases

Das Projekt folgt [Semantic Versioning](https://semver.org/lang/de/). Änderungen stehen im [CHANGELOG.md](CHANGELOG.md); ein Tag `vX.Y.Z`, der zu `package.json` passt, erzeugt über `.github/workflows/release.yml` ein GitHub-Release. Automatische Daten-Commits (`chore(data)`) erzeugen keine Versionen.

## Mitmachen

Beiträge sind willkommen — auf Deutsch oder Englisch. Bitte [CONTRIBUTING.md](CONTRIBUTING.md) und den [Code of Conduct](CODE_OF_CONDUCT.md) lesen. Sicherheitslücken: siehe [SECURITY.md](SECURITY.md).

## Lizenz

Code: MIT. Daten und Marken gehören ihren jeweiligen Rechteinhabern. GTA, Grand Theft Auto und Rockstar Games sind Marken von Take-Two Interactive.
