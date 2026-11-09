const STORAGE_KEY = 'gta-dashboard-lang';
const SUPPORTED = ['de', 'en', 'fr'];

const T = [
  ['Zum Inhalt springen', 'Skip to content', 'Aller au contenu'],
  ['Markt', 'Market', 'Marché'],
  ['Krankenstand', 'Sick Leave', 'Arrêts maladie'],
  ['Hype & Stores', 'Hype & Stores', 'Hype & Boutiques'],
  ['Netzwerk', 'Network', 'Réseau'],
  ['Peaks', 'Peaks', 'Pics'],
  ['Investor', 'Investor', 'Investisseurs'],
  ['Timeline', 'Timeline', 'Chronologie'],
  ['Methodik', 'Methodology', 'Méthodologie'],
  ['MENÜ', 'MENU', 'MENU'],
  ['MARKET WIRE', 'MARKET WIRE', 'FIL MARCHÉ'],
  ['ROCKSTAR GAMES', 'ROCKSTAR GAMES', 'ROCKSTAR GAMES'],
  ['GRAND THEFT AUTO VI', 'GRAND THEFT AUTO VI', 'GRAND THEFT AUTO VI'],
  ['RELEASE INTELLIGENCE', 'RELEASE INTELLIGENCE', 'RENSEIGNEMENT DE LANCEMENT'],
  ['Aktien, Suchtverhalten, Krankenstand und Netzwerk-Traffic: ein datengetriebener Blick auf den Release, der 2026 alles überstrahlt. Täglich aktualisiert, morgens und abends.', 'Stocks, search behaviour, sick leave and network traffic: a data-driven look at the release that overshadows everything in 2026. Updated daily, morning and evening.', 'Actions, recherches, arrêts maladie et trafic réseau : un regard data-driven sur le lancement qui éclipse tout en 2026. Mis à jour chaque jour, matin et soir.'],
  ['PRELOAD STARTET IN', 'PRELOAD STARTS IN', 'PRÉCHARGEMENT DANS'],
  ['RELEASE STARTET IN', 'RELEASE STARTS IN', 'LANCEMENT DANS'],
  ['JETZT IN LEONIDA', 'NOW IN LEONIDA', 'MAINTENANT À LEONIDA'],
  ['Tage', 'Days', 'Jours'],
  ['Std', 'Hrs', 'H'],
  ['Min', 'Min', 'Min'],
  ['Sek', 'Sec', 'Sec'],
  ['Aktueller Traffic', 'Current traffic', 'Trafic actuel'],
  ['OSINT Composite', 'OSINT Composite', 'Composite OSINT'],
  ['SCROLL', 'SCROLL', 'DÉFILER'],
  ['VICE CITY PROSPECT', 'VICE CITY PROSPECT', 'PROSPECT VICE CITY'],
  ['Drei Blicke nach Leonida.', 'Three looks at Leonida.', 'Trois regards sur Leonida.'],
  ['Offizielles Key-Art, in drei Ausschnitten: Lucia und Jason, das Logo und die Welt von Vice City. Bildmaterial: Rockstar Games / PlayStation Blog.', 'Official key art in three crops: Lucia and Jason, the logo and the world of Vice City. Image credit: Rockstar Games / PlayStation Blog.', 'Key art officiel en trois extraits : Lucia et Jason, le logo et le monde de Vice City. Crédit image : Rockstar Games / PlayStation Blog.'],
  ['Die Geschichte', 'The Story', "L'histoire"],
  ['Der Schauplatz', 'The Setting', 'Le décor'],
  ['Die Welt', 'The World', 'Le monde'],
  ['Bildmaterial: © Rockstar Games /', 'Image credit: © Rockstar Games / ', 'Crédit image : © Rockstar Games / '],
  ['· Fan-Projekt, keine offizielle Verbindung.', ' · Fan project, not officially affiliated.', ' · Projet de fan, non affilié officiellement.'],
  ['01 / MARKET PULSE', '01 / MARKET PULSE', '01 / MARCHÉ'],
  ['Der Markt preist den Hype.', 'The market is pricing the hype.', 'Le marché intègre déjà le hype.'],
  ['Take-Two, Publisher, Delivery und Plattformen: Der GTA-VI-Basket bündelt die Firmen, die vom Release profitieren könnten. Equal Weight, tägliche Kurse, ein Jahr Historie.', 'Take-Two, publishers, delivery and platforms: the GTA VI basket bundles the companies that could benefit from the release. Equal weight, daily prices, one year of history.', 'Take-Two, éditeurs, livraison et plateformes : le panier GTA VI regroupe les entreprises qui pourraient profiter du lancement. Pondération égale, cours quotidiens, un an d’historique.'],
  ['Equal-Weight Index · Real', 'Equal-Weight Index · Real', 'Indice équipondéré · Réel'],
  ['GTA VI Basket vs. Delivery', 'GTA VI Basket vs. Delivery', 'Panier GTA VI vs Livraison'],
  ['Täglich · morgens & abends · 1 Jahr Historie', 'Daily · morning & evening · 1 year history', 'Quotidien · matin & soir · 1 an d’historique'],
  ['Alle', 'All', 'Tous'],
  ['Plattform', 'Platform', 'Plateforme'],
  ['Gaming', 'Gaming', 'Jeux'],
  ['Delivery', 'Delivery', 'Livraison'],
  ['Retail', 'Retail', 'Commerce'],
  ['02 / KRANKENSTAND', '02 / SICK LEAVE', '02 / ARRÊTS MALADIE'],
  ['Wenn Leonida die Büros leerräumt.', 'When Leonida empties the offices.', 'Quand Leonida vide les bureaux.'],
  ['Offizielle Krankenstandsdaten erscheinen mit Wochen Verzug. Dieses Dashboard trackt deshalb Leading Indicators: Suchverhalten, News-Volumen und Wikipedia-Interesse rund um Krankmeldung, Krankenstand und Arbeitsunfähigkeit.', 'Official sick-leave data is published with a delay of weeks. This dashboard therefore tracks leading indicators: search behaviour, news volume and Wikipedia interest around sick notes, sick leave and incapacity to work.', 'Les données officielles sur les arrêts maladie paraissent avec plusieurs semaines de retard. Ce tableau de bord suit donc des indicateurs avancés : recherches, volume d’actualités et intérêt Wikipédia autour des arrêts maladie et de l’incapacité de travail.'],
  ['Leading Indicator · Proxy', 'Leading Indicator · Proxy', 'Indicateur avancé · Proxy'],
  ['Sick Leave Signal', 'Sick Leave Signal', 'Signal arrêts maladie'],
  ['Wird geladen …', 'Loading …', 'Chargement …'],
  ['WIRD GELADEN', 'LOADING', 'CHARGEMENT'],
  ['niedrig', 'low', 'faible'],
  ['erhöht', 'elevated', 'élevé'],
  ['eskaliert', 'escalated', 'critique'],
  ['Wikipedia Pageviews · Proxy', 'Wikipedia Pageviews · Proxy', 'Pages vues Wikipédia · Proxy'],
  ['Krankheit im Suchverhalten', 'Illness in search behaviour', 'La maladie dans les recherches'],
  ['DIE THESE', 'THE THESIS', 'LA THÈSE'],
  ['„212 GB Download, 24 Stunden Wachheit und ein Arbeitgeber, der nichts davon weiß.“', '“212 GB download, 24 hours awake and an employer who knows nothing about it.”', '« 212 Go à télécharger, 24 heures d’éveil et un employeur qui n’en sait rien. »'],
  ['Der Blogpost von 2024 hat es vorgedacht: Releases machen Leute krank. Dieses Dashboard prüft die These täglich mit den besten öffentlich verfügbaren Signalen — und liefert bewusst keine Scheinkorrelation als Wahrheit.', 'The 2024 blog post anticipated it: releases make people sick. This dashboard tests the thesis daily with the best publicly available signals — and deliberately does not present spurious correlation as truth.', 'L’article de 2024 l’avait anticipé : les lancements rendent les gens malades. Ce tableau de bord teste cette thèse chaque jour avec les meilleurs signaux publics — sans présenter de corrélation fallacieuse comme une vérité.'],
  ['03 / HYPE & OSINT', '03 / HYPE & OSINT', '03 / HYPE & OSINT'],
  ['Was das Internet verrät.', 'What the internet reveals.', 'Ce que révèle Internet.'],
  ['Vom Trailer bis zum Supermarkt: Wir verfolgen Suchinteresse, Medien, Community und den Hype im Handel. ', 'From trailer to supermarket: we track search interest, media, community and hype in retail. ', 'De la bande-annonce au supermarché : nous suivons la recherche, les médias, la communauté et le hype dans le commerce. '],
  ['Stores & Merch ↓', 'Stores & Merch ↓', 'Boutiques & Merch ↓'],
  ['Themenradar ↓', 'Topic radar ↓', 'Radar des sujets ↓'],
  ['Prospekt-Funde ↓', 'Leaflet finds ↓', 'Trouvailles prospectus ↓'],
  ['Hype Monitor · Proxy · 0–100', 'Hype Monitor · Proxy · 0–100', 'Moniteur de hype · Proxy · 0–100'],
  ['Wie heiß läuft der Hype?', 'How hot is the hype?', 'Le hype est-il chaud ?'],
  ['Signale werden ausgewertet …', 'Evaluating signals …', 'Analyse des signaux …'],
  ['Was steckt im Score?', 'What is behind the score?', 'Que contient le score ?'],
  ['Suchinteresse 45 %: Mittel der EN-/DE-Wikipedia-Verhältnisse, letzte sieben Tage gegen die sieben Tage davor. Medienecho 35 %: englische RSS-Treffer der letzten 24 Stunden gegen den Tagesdurchschnitt des Sieben-Tage-Samples. Community 20 %: Posts pro Stunde im Reddit-Sample.', 'Search interest 45%: average of EN/DE Wikipedia ratios, last seven days versus the seven days before. Media echo 35%: English RSS hits in the last 24 hours versus the daily average of the seven-day sample. Community 20%: posts per hour in the Reddit sample.', 'Intérêt de recherche 45 % : moyenne des ratios Wikipédia EN/DE, sept derniers jours contre les sept jours précédents. Écho média 35 % : résultats RSS anglais des dernières 24 heures contre la moyenne quotidienne de l’échantillon sur sept jours. Communauté 20 % : posts par heure dans l’échantillon Reddit.'],
  ['Die Teilwerte werden auf 0–100 begrenzt: Wikipedia = 50 + (Verhältnis − 1) × 42; News = 50 + ((24h + 0,6) / (7T / 7 + 0,6) − 1) × 42; Reddit = Posts/h × 3,2. Bei fehlenden Quellen werden die verbleibenden Gewichte neu verteilt. Fehlerhafte oder über 48 Stunden alte Daten werden nicht gewertet.', 'Sub-scores are capped at 0–100: Wikipedia = 50 + (ratio − 1) × 42; News = 50 + ((24h + 0.6) / (7D / 7 + 0.6) − 1) × 42; Reddit = posts/h × 3.2. If sources are missing, the remaining weights are redistributed. Faulty or older-than-48-hour data is not counted.', 'Les sous-scores sont plafonnés à 0–100 : Wikipédia = 50 + (ratio − 1) × 42 ; News = 50 + ((24h + 0,6) / (7J / 7 + 0,6) − 1) × 42 ; Reddit = posts/h × 3,2. Si des sources manquent, les poids restants sont redistribués. Les données erronées ou de plus de 48 heures ne sont pas comptées.'],
  ['Redaktionell gewählte Gewichtung; Aufmerksamkeit ist keine Stimmungsmessung und keine Absatzprognose. Store-Verkäufe, Wunschlisten, YouTube-Aufrufe und TikTok-Reichweiten werden nicht gemessen. Retail Watch bleibt ein qualitatives Signal.', 'Editorially chosen weighting; attention is not sentiment measurement or a sales forecast. Store sales, wishlists, YouTube views and TikTok reach are not measured. Retail Watch remains a qualitative signal.', 'Pondération éditoriale ; l’attention n’est ni une mesure de sentiment ni une prévision de ventes. Les ventes en boutique, listes de souhaits, vues YouTube et portées TikTok ne sont pas mesurées. Retail Watch reste un signal qualitatif.'],
  ['Hype im Zeitverlauf', 'Hype over time', 'Hype dans le temps'],
  ['Wie viele Menschen nach Leonida suchen', 'How many people are searching for Leonida', 'Combien de personnes cherchent Leonida'],
  ['Google News RSS', 'Google News RSS', 'Google News RSS'],
  ['Schlagzeilen', 'Headlines', 'Titres'],
  ['Reddit Pulse', 'Reddit Pulse', 'Pouls Reddit'],
  ['Google Trends · DE/US', 'Google Trends · DE/US', 'Google Trends · DE/US'],
  ['Trending Now', 'Trending Now', 'Tendances actuelles'],
  ['Themenradar · Google News RSS · DE', 'Topic radar · Google News RSS · DE', 'Radar des sujets · Google News RSS · DE'],
  ['Worüber gerade gesprochen wird.', 'What people are talking about right now.', 'De quoi parle-t-on en ce moment.'],
  ['Handel, Hardware, Creator und Release-Fragen: gezielte Suchabfragen zeigen, wo GTA VI Schlagzeilen macht. Jede Karte verlinkt ihre Belege.', 'Retail, hardware, creators and release questions: targeted searches show where GTA VI makes headlines. Every card links to its evidence.', 'Commerce, matériel, créateurs et questions de lancement : des recherches ciblées montrent où GTA VI fait les gros titres. Chaque carte renvoie à ses preuves.'],
  ['RSS-Stichproben mit höchstens 100 Ergebnissen je Abfrage. Themen überschneiden sich; Trefferzahlen sind keine Marktanteile und messen keine Social-Media-Reichweite.', 'RSS samples with at most 100 results per query. Topics overlap; hit counts are not market shares and do not measure social-media reach.', 'Échantillons RSS avec au maximum 100 résultats par requête. Les sujets se chevauchent ; les nombres de résultats ne sont pas des parts de marché et ne mesurent pas la portée sociale.'],
  ['Store Directory · Spiele, Merch & Alltag', 'Store Directory · Games, Merch & Everyday', 'Annuaire · Jeux, Merch & Quotidien'],
  ['Wo der Hype landet.', 'Where the hype lands.', 'Où le hype atterrit.'],
  ['Direkt zu den Konsolen-Stores, Händlern und zur GTA-VI-Collection. Bei den Supermärkten findest du die offiziellen Anlaufstellen zu den Community-Funden.', 'Direct links to console stores, retailers and the GTA VI collection. For supermarkets you will find the official contact points for the community finds.', 'Liens directs vers les boutiques de consoles, les détaillants et la collection GTA VI. Pour les supermarchés, vous trouverez les points de contact officiels des trouvailles de la communauté.'],
  ['Spiel & Stores', 'Games & Stores', 'Jeux & Boutiques'],
  ['Supermarkt', 'Supermarket', 'Supermarché'],
  ['Preise, Editionen und Verfügbarkeit stehen beim jeweiligen Anbieter. Keine Affiliate-Links. Ein Store-Link allein belegt keine Nachfrage oder Kooperation.', 'Prices, editions and availability are shown by the respective provider. No affiliate links. A store link alone does not prove demand or partnership.', 'Les prix, éditions et disponibilités sont indiqués par chaque fournisseur. Pas de liens affiliés. Un lien boutique ne prouve ni la demande ni un partenariat.'],
  ['Retail Watch · Community · Proxy', 'Retail Watch · Community · Proxy', 'Retail Watch · Communauté · Proxy'],
  ['Der Hype im Supermarkt.', 'The hype in the supermarket.', 'Le hype au supermarché.'],
  ['Welche Händler tauchen im GTA-VI-Gespräch auf? Prospekt-Funde aus der Community zeigen, wie der Release im Alltag ankommt.', 'Which retailers appear in the GTA VI conversation? Community leaflet finds show how the release lands in everyday life.', 'Quels détaillants apparaissent dans la conversation GTA VI ? Les trouvailles de prospectus de la communauté montrent comment le lancement arrive au quotidien.'],
  ['Für die Fundliste bitte JavaScript aktivieren.', 'Please enable JavaScript for the find list.', 'Veuillez activer JavaScript pour la liste des trouvailles.'],
  ['Original-Thread von @lucaslu_ckli ↗', 'Original thread by @lucaslu_ckli ↗', 'Fil original de @lucaslu_ckli ↗'],
  ['Manuell kuratierte Community-Beobachtungen. Händlerzuordnung, Echtheit der Prospekte und offizielle Kooperationen sind nicht unabhängig bestätigt. Die Funde fließen nicht in den Hype-Score ein und belegen keine Umsatzwirkung.', 'Manually curated community observations. Retailer attribution, authenticity of the leaflets and official partnerships are not independently confirmed. The finds do not feed into the hype score and do not prove any sales impact.', 'Observations communautaires curatées manuellement. L’attribution aux détaillants, l’authenticité des prospectus et les partenariats officiels ne sont pas confirmés indépendamment. Les trouvailles n’alimentent pas le score de hype et ne prouvent aucun impact sur les ventes.'],
  ['04 / NETWORK WATCH', '04 / NETWORK WATCH', '04 / RÉSEAU'],
  ['Wenn 212 GB durch die Leitungen gehen.', 'When 212 GB travel through the pipes.', 'Quand 212 Go passent dans les tuyaux.'],
  ['Am 10. November startet der Preload. Dieses Panel beobachtet den DE-CIX Frankfurt, den Rockstar-Endpoint und den offiziellen Preload-Status — stündlich während des Release-Fensters.', 'Preload starts on 10 November. This panel watches DE-CIX Frankfurt, the Rockstar endpoint and the official preload status — hourly during the release window.', 'Le préchargement commence le 10 novembre. Ce panneau surveille DE-CIX Francfort, l’endpoint Rockstar et le statut officiel du préchargement — toutes les heures pendant la fenêtre de lancement.'],
  ['DE-CIX Frankfurt · Real', 'DE-CIX Frankfurt · Real', 'DE-CIX Francfort · Réel'],
  ['Bits pro Sekunde', 'Bits per second', 'Bits par seconde'],
  ['Preload Watch', 'Preload Watch', 'Suivi du préchargement'],
  ['DE-CIX · November', 'DE-CIX · November', 'DE-CIX · Novembre'],
  ['Tages-Peaks', 'Daily Peaks', 'Pics quotidiens'],
  ['05 / PEAKS & RECORDS', '05 / PEAKS & RECORDS', '05 / PICS & RECORDS'],
  ['Die höchsten Ausschläge.', 'The highest spikes.', 'Les plus grands pics.'],
  ['Peaks sind lauter als Durchschnitte. Reale Rekorde, Proxy-Höchstwerte und der Abstand zum aktuellen Stand — jeweils mit Quelle und Datenqualität.', 'Peaks are louder than averages. Real records, proxy highs and the distance to the current level — each with source and data quality.', 'Les pics sont plus parlants que les moyennes. Records réels, sommets proxy et écart avec le niveau actuel — avec source et qualité des données.'],
  ['06 / INVESTOR WATCH', '06 / INVESTOR WATCH', '06 / INVESTISSEURS'],
  ['Was Take-Two als Nächstes zeigt.', 'What Take-Two shows next.', 'Ce que Take-Two dévoile ensuite.'],
  ['Q2 FY2027 Results am 9. November 2026, Earnings Call um 22:30 CET. Dazu die neuesten SEC-Filings und IR-Pressemitteilungen — echte Zahlen statt Bauchgefühl.', 'Q2 FY2027 results on 9 November 2026, earnings call at 22:30 CET. Plus the latest SEC filings and IR press releases — real numbers instead of gut feeling.', 'Résultats du T2 FY2027 le 9 novembre 2026, conférence téléphonique à 22 h 30 CET. Plus les derniers dépôts SEC et communiqués IR — de vrais chiffres plutôt qu’une intuition.'],
  ['Take-Two IR · Real', 'Take-Two IR · Real', 'Take-Two IR · Réel'],
  ['Q2 FY2027 Earnings', 'Q2 FY2027 Earnings', 'Résultats T2 FY2027'],
  ['SEC EDGAR · Real', 'SEC EDGAR · Real', 'SEC EDGAR · Réel'],
  ['Latest Filings', 'Latest Filings', 'Derniers dépôts'],
  ['Take-Two IR · Press Releases', 'Take-Two IR · Press Releases', 'Take-Two IR · Communiqués'],
  ['Offizielle Meldungen', 'Official announcements', 'Annonces officielles'],
  ['07 / TIMELINE', '07 / TIMELINE', '07 / CHRONOLOGIE'],
  ['Der Weg nach Leonida.', 'The road to Leonida.', 'La route vers Leonida.'],
  ['Vom ersten Trailer bis zum Preload: die Meilensteine, die den Markt und die Netzwerke bewegt haben — und die noch kommen.', 'From the first trailer to preload: the milestones that moved the market and the networks — and those still to come.', 'De la première bande-annonce au préchargement : les étapes qui ont fait bouger le marché et les réseaux — et celles à venir.'],
  ['08 / METHODIK', '08 / METHODOLOGY', '08 / MÉTHODOLOGIE'],
  ['Wie wir messen.', 'How we measure.', 'Comment nous mesurons.'],
  ['Keine Blackbox: Jede Zahl hat eine Quelle, einen Zeitstempel und eine bewusste Grenze. Was hier steht, ist ein Signal — keine Prognose.', 'No black box: every number has a source, a timestamp and a deliberate limit. What you see here is a signal — not a forecast.', 'Pas de boîte noire : chaque chiffre a une source, un horodatage et une limite assumée. Ce que vous voyez est un signal — pas une prévision.'],
  ['Aktien', 'Stocks', 'Actions'],
  ['Yahoo-Finance-Chart-API, ein Jahr Tageshistorie. Morgens und abends wird ein Snapshot gezogen. Equal-Weight-Baskets mitteln Tagesrenditen, keine Kursziele.', 'Yahoo Finance chart API, one year of daily history. A snapshot is taken morning and evening. Equal-weight baskets average daily returns, not price targets.', 'API graphique Yahoo Finance, un an d’historique quotidien. Un snapshot est pris matin et soir. Les paniers équipondérés moyennent les rendements quotidiens, pas les objectifs de cours.'],
  ['Wikipedia-Pageviews und Google-News-Volumen für Krankmeldung, Krankenstand und Arbeitsunfähigkeit. Offizielle Krankenkassen-Daten erscheinen mit Verzug — das hier ist ein Leading Indicator.', 'Wikipedia pageviews and Google News volume for sick notes, sick leave and incapacity to work. Official health-insurer data is delayed — this is a leading indicator.', 'Pages vues Wikipédia et volume Google News pour les arrêts maladie, le taux d’absentéisme et l’incapacité de travail. Les données officielles des assureurs arrivent avec du retard — ceci est un indicateur avancé.'],
  ['Hype & OSINT', 'Hype & OSINT', 'Hype & OSINT'],
  ['Erklärter Hype-Score aus Wikipedia (45 %), News (35 %) und Reddit (20 %). Zusätzlich Steam, Trends und vier News-Themenfelder. Der Verlauf speichert echte Snapshots; ältere Daten und Ausfälle sind gekennzeichnet.', 'Explained hype score from Wikipedia (45%), news (35%) and Reddit (20%). Plus Steam, Trends and four news topic areas. The history stores real snapshots; older data and outages are marked.', 'Score de hype expliqué à partir de Wikipédia (45 %), des actualités (35 %) et de Reddit (20 %). Plus Steam, Trends et quatre domaines d’actualité. L’historique conserve de vrais snapshots ; les données anciennes et les pannes sont signalées.'],
  ['DE-CIX-Frankfurt-API (2 Tage, 5-Minuten-Punkte) und ein Rockstar-Endpoint-Probe. Latenz ist keine Traffic-Messung, sondern ein Verfügbarkeits-Signal.', 'DE-CIX Frankfurt API (2 days, 5-minute points) and a Rockstar endpoint probe. Latency is not a traffic measurement, but an availability signal.', 'API DE-CIX Francfort (2 jours, points de 5 minutes) et une sonde endpoint Rockstar. La latence n’est pas une mesure de trafic, mais un signal de disponibilité.'],
  ['Investor', 'Investor', 'Investisseurs'],
  ['Take-Two-IR-Seite und SEC-EDGAR-Submissions: Earnings-Termin, Webcast, Annual Meeting und die neuesten 10-Q-, 10-K-, 8-K- und DEF-14A-Filings.', 'Take-Two IR page and SEC EDGAR submissions: earnings date, webcast, annual meeting and the latest 10-Q, 10-K, 8-K and DEF 14A filings.', 'Page IR Take-Two et dépôts SEC EDGAR : date des résultats, webcast, assemblée annuelle et les derniers dépôts 10-Q, 10-K, 8-K et DEF 14A.'],
  ['Retail Watch', 'Retail Watch', 'Retail Watch'],
  ['Manuell kuratierte Prospekt-Funde mit Originalbeitrag, Veröffentlichungsdatum und Links zu den geteilten Bildern. Community-Beobachtungen sind ein qualitativer Proxy; Händleraktionen und Umsatzwirkungen sind damit nicht bestätigt.', 'Manually curated leaflet finds with original post, publication date and links to the shared images. Community observations are a qualitative proxy; retailer promotions and sales effects are not confirmed.', 'Trouvailles de prospectus curatées manuellement avec publication d’origine, date de publication et liens vers les images partagées. Les observations communautaires sont un proxy qualitatif ; les promotions des détaillants et les effets sur les ventes ne sont pas confirmés.'],
  ['Datenqualität', 'Data quality', 'Qualité des données'],
  ['Real', 'Real', 'Réel'],
  ['Proxy', 'Proxy', 'Proxy'],
  ['Leading', 'Leading', 'Avancé'],
  ['= Aktien, DE-CIX, SEC/IR.', '= stocks, DE-CIX, SEC/IR.', '= actions, DE-CIX, SEC/IR.'],
  ['= Wikipedia, News, Reddit, Trends, Retail Watch.', '= Wikipedia, news, Reddit, trends, Retail Watch.', '= Wikipédia, actualités, Reddit, tendances, Retail Watch.'],
  ['= Sick-Leave-Signal. Jede Karte ist entsprechend markiert.', '= sick-leave signal. Every card is marked accordingly.', '= signal d’arrêt maladie. Chaque carte est marquée en conséquence.'],
  ['Transparenz', 'Transparency', 'Transparence'],
  ['Quellen & Grenzen', 'Sources & limits', 'Sources & limites'],
  ['Markt, Netzwerk, SEC/IR', 'Market, network, SEC/IR', 'Marché, réseau, SEC/IR'],
  ['Wikipedia, News, Reddit, Trends, Retail Watch', 'Wikipedia, news, Reddit, trends, Retail Watch', 'Wikipédia, actualités, Reddit, tendances, Retail Watch'],
  ['Kein Finanzrat, keine Anlageempfehlung. Dieses Dashboard ist ein Fan-Projekt und steht in keiner Verbindung zu Rockstar Games oder Take-Two. Alle Daten kommen aus öffentlichen Quellen; Fehler und Verzögerungen sind möglich.', 'Not financial advice, not an investment recommendation. This dashboard is a fan project and is not affiliated with Rockstar Games or Take-Two. All data comes from public sources; errors and delays are possible.', 'Ceci n’est pas un conseil financier ni une recommandation d’investissement. Ce tableau de bord est un projet de fan et n’est pas affilié à Rockstar Games ou Take-Two. Toutes les données proviennent de sources publiques ; des erreurs et des retards sont possibles.'],
  ['Galerie', 'Gallery', 'Galerie'],
  ['Der Blogpost ↗', 'The blog post ↗', "L'article de blog ↗"],
  ['WERBUNG · GTA V SONG', 'AD · GTA V SONG', 'PUB · GTA V SONG'],
  ['GTA V · Offizieller Soundtrack', 'GTA V · Official Soundtrack', 'GTA V · Bande originale'],
  ['GTA V · Offizieller Soundtrack ↗', 'GTA V · Official Soundtrack ↗', 'GTA V · Bande originale ↗'],
  ['Ton an', 'Sound on', 'Son on'],
  ['Ton aus', 'Sound off', 'Son off'],
  ['Schließen', 'Close', 'Fermer'],
  ['Externer Inhalt', 'External content', 'Contenu externe'],
  ['DE-CIX · All-Time Peak', 'DE-CIX · All-Time Peak', 'DE-CIX · Pic historique'],
  ['DE-CIX · November Peak', 'DE-CIX · November Peak', 'DE-CIX · Pic de novembre'],
  ['DE-CIX · Tages-Peak', 'DE-CIX · Daily Peak', 'DE-CIX · Pic quotidien'],
  ['TTWO · 52W High', 'TTWO · 52W High', 'TTWO · Plus haut 52S'],
  ['GTA Basket · 90T High', 'GTA Basket · 90D High', 'Panier GTA · Plus haut 90J'],
  ['Wikipedia · Peak', 'Wikipedia · Peak', 'Wikipédia · Pic'],
  ['Reddit · Members', 'Reddit · Members', 'Reddit · Membres'],
  ['DE-CIX · Aktuell', 'DE-CIX · Current', 'DE-CIX · Actuel'],
  ['DE-CIX · November', 'DE-CIX · November', 'DE-CIX · Novembre'],
  ['DE-CIX · All-Time', 'DE-CIX · All-Time', 'DE-CIX · Historique'],
  ['Rockstar Probe', 'Rockstar Probe', 'Sonde Rockstar'],
  ['Frankfurt · live', 'Frankfurt · live', 'Francfort · live'],
  ['Peak', 'Peak', 'Pic'],
  ['Endpoint', 'Endpoint', 'Endpoint'],
  ['Latest 10-Q', 'Latest 10-Q', 'Dernier 10-Q'],
  ['Earnings Call', 'Earnings Call', 'Conférence résultats'],
  ['Annual Meeting', 'Annual Meeting', 'Assemblée annuelle'],
  ['bereits gelaufen', 'already held', 'déjà tenue'],
  ['kein Filing', 'no filing', 'aucun dépôt'],
  ['Ergebnisse · Take-Two IR', 'Results · Take-Two IR', 'Résultats · Take-Two IR'],
  ['Webcast · 22:30 CET', 'Webcast · 22:30 CET', 'Webcast · 22:30 CET'],
  ['DE-CIX · November-Archiv', 'DE-CIX · November archive', 'DE-CIX · Archives de novembre'],
  ['Yahoo Finance · Konsens', 'Yahoo Finance · Consensus', 'Yahoo Finance · Consensus'],
  ['Hype-Themenradar · Google News RSS', 'Hype topic radar · Google News RSS', 'Radar des sujets hype · Google News RSS'],
  ['Sick Leave Signal', 'Sick Leave Signal', 'Signal arrêts maladie'],
  ['Krankenstand · 7T', 'Sick leave · 7D', 'Arrêts maladie · 7J'],
  ['Arbeitsunfähigkeit · 7T', 'Incapacity · 7D', 'Incapacité · 7J'],
  ['News · 24h', 'News · 24h', 'Actualités · 24h'],
  ['Leading Indicator · 0–100', 'Leading Indicator · 0–100', 'Indicateur avancé · 0–100'],
  ['Pageviews · 7T', 'Pageviews · 7D', 'Pages vues · 7J'],
  ['Concurrent Players', 'Concurrent Players', 'Joueurs simultanés'],
  ['OSINT Composite · 0–100', 'OSINT Composite · 0–100', 'Composite OSINT · 0–100'],
  ['Reddit Members', 'Reddit Members', 'Membres Reddit'],
  ['Keine Schlagzeilen verfügbar.', 'No headlines available.', 'Aucun titre disponible.'],
  ['Reddit-Daten gerade nicht verfügbar.', 'Reddit data currently unavailable.', 'Données Reddit indisponibles.'],
  ['Google Trends liefert gerade keine Daten.', 'Google Trends is not returning data right now.', 'Google Trends ne fournit pas de données pour le moment.'],
  ['GTA trendet aktuell nicht in den DE-Top-10. Hier die Top-Trends:', 'GTA is not trending in the DE top 10 right now. Here are the top trends:', 'GTA n’est pas dans le top 10 allemand actuellement. Voici les tendances :'],
  ['Unauffällig: kein erhöhtes Signal gegenüber dem 7-Tage-Schnitt.', 'Unremarkable: no elevated signal versus the 7-day average.', 'Normal : aucun signal élevé par rapport à la moyenne sur 7 jours.'],
  ['Erhöhtes Signal: Suchvolumen und News liegen deutlich über dem 7-Tage-Schnitt.', 'Elevated signal: search volume and news are clearly above the 7-day average.', 'Signal élevé : le volume de recherche et les actualités dépassent nettement la moyenne sur 7 jours.'],
  ['Leicht erhöht: erste Vorzeichen über dem 7-Tage-Schnitt.', 'Slightly elevated: first signs above the 7-day average.', 'Légèrement élevé : premiers signes au-dessus de la moyenne sur 7 jours.'],
  ['Noch nicht genug Daten für ein Signal.', 'Not enough data for a signal yet.', 'Pas encore assez de données pour un signal.'],
  ['Keine Schlagzeilen verfügbar.', 'No headlines available.', 'Aucun titre disponible.'],
  ['Preorder', 'Preorder', 'Précommande'],
  ['PS5 Preload', 'PS5 Preload', 'Préchargement PS5'],
  ['Xbox Preload', 'Xbox Preload', 'Préchargement Xbox'],
  ['Physical', 'Physical', 'Physique'],
  ['Release', 'Release', 'Lancement'],
  ['Equal-Weight · 30 Tage', 'Equal-Weight · 30 days', 'Équipondéré · 30 jours'],
  ['Base 100 · 30T', 'Base 100 · 30D', 'Base 100 · 30J'],
  ['Tages-Peaks', 'Daily Peaks', 'Pics quotidiens'],
  ['Die höchsten Ausschläge.', 'The highest spikes.', 'Les plus grands pics.'],
  ['Höchster 5-Minuten-Punkt des letzten Tages', 'Highest 5-minute point of the last day', 'Plus haut point de 5 minutes du dernier jour'],
  ['Höchster Tageswert · Proxy', 'Highest daily value · Proxy', 'Plus haute valeur quotidienne · Proxy'],
  ['Community-Größe · Proxy', 'Community size · Proxy', 'Taille de la communauté · Proxy'],
  ['Aktueller Traffic · Peak 21,47 Tbit/s', 'Current traffic · Peak 21.47 Tbit/s', 'Trafic actuel · Pic 21,47 Tbit/s'],
  ['Q2 FY2027 Earnings', 'Q2 FY2027 Earnings', 'Résultats T2 FY2027'],
  ['Latest Filings', 'Latest Filings', 'Derniers dépôts'],
  ['Offizielle Meldungen', 'Official announcements', 'Annonces officielles'],
  ['Take-Two IR · Real', 'Take-Two IR · Real', 'Take-Two IR · Réel'],
  ['SEC EDGAR · Real', 'SEC EDGAR · Real', 'SEC EDGAR · Réel'],
  ['Konsens · Yahoo Finance', 'Consensus · Yahoo Finance', 'Consensus · Yahoo Finance'],
  ['Die Q2-Zahlen sind der harte Realitätscheck vor dem Release. Der 19. November bleibt der größte Katalysator — die Guidance entscheidet, wie viel GTA VI schon im Kurs steckt.', 'The Q2 numbers are the hard reality check before the release. 19 November remains the biggest catalyst — guidance decides how much GTA VI is already priced in.', 'Les chiffres du T2 sont le test de réalité avant le lancement. Le 19 novembre reste le principal catalyseur — les prévisions décideront de ce qui est déjà intégré dans le cours.'],

  ['AKTUELL', 'CURRENT', 'ACTUEL'],
  ['NOVEMBER PEAK', 'NOVEMBER PEAK', 'PIC NOVEMBRE'],
  ['ALL-TIME PEAK', 'ALL-TIME PEAK', 'PIC HISTORIQUE'],
  ['RANGE AVERAGE', 'RANGE AVERAGE', 'MOYENNE PÉRIODE'],
  ['Aktuell', 'Current', 'Actuel'],
  ['Range Average', 'Range average', 'Moyenne période'],
  ['Equal-Weight · 90 Tage', 'Equal-Weight · 90 days', 'Équipondéré · 90 jours'],
  ['GTA VI Basket', 'GTA VI Basket', 'Panier GTA VI'],
  ['Delivery Basket', 'Delivery Basket', 'Panier Livraison'],
  ['Retail / Meme', 'Retail / Meme', 'Commerce / Meme'],
  ['Publisher · Plattform · GPU', 'Publisher · Platform · GPU', 'Éditeur · Plateforme · GPU'],
  ['GTA VI Publisher', 'GTA VI Publisher', 'Éditeur GTA VI'],
  ['Publisher', 'Publisher', 'Éditeur'],
  ['Publisher · Polen', 'Publisher · Poland', 'Éditeur · Pologne'],
  ['Publisher · Frankreich', 'Publisher · France', 'Éditeur · France'],
  ['Platform · UGC', 'Platform · UGC', 'Plateforme · UGC'],
  ['Platform · Japan', 'Platform · Japan', 'Plateforme · Japon'],
  ['PlayStation', 'PlayStation', 'PlayStation'],
  ['Xbox · Cloud', 'Xbox · Cloud', 'Xbox · Cloud'],
  ['GPU · AI', 'GPU · AI', 'GPU · IA'],
  ['Uber Eats', 'Uber Eats', 'Uber Eats'],
  ['Delivery · Deutschland', 'Delivery · Germany', 'Livraison · Allemagne'],
  ['Retail · Meme', 'Retail · Meme', 'Commerce · Meme'],
  ['Cloud · Retail', 'Cloud · Retail', 'Cloud · Commerce'],
  ['GAMING', 'GAMING', 'JEUX'],
  ['PLATFORM', 'PLATFORM', 'PLATEFORME'],
  ['DELIVERY', 'DELIVERY', 'LIVRAISON'],
  ['RETAIL', 'RETAIL', 'COMMERCE'],
  ['OTHER', 'OTHER', 'AUTRE'],
  ['PRELOAD GEPLANT', 'PRELOAD SCHEDULED', 'PRÉCHARGEMENT PRÉVU'],
  ['PRELOAD LÄUFT', 'PRELOAD RUNNING', 'PRÉCHARGEMENT EN COURS'],
  ['RELEASED', 'RELEASED', 'SORTI'],
  ['PS5-Preload startet am 10. November um 00:00 lokal. Xbox startet weltweit um 00:00 GMT (01:00 CET).', 'PS5 preload starts on 10 November at 00:00 local time. Xbox starts worldwide at 00:00 GMT (01:00 CET).', 'Le préchargement PS5 commence le 10 novembre à 00:00 heure locale. Xbox commence dans le monde à 00:00 GMT (01:00 CET).'],
  ['Der Preload läuft. 212 GB pro Installation — der DE-CIX wird es sehen.', 'Preload is running. 212 GB per installation — DE-CIX will notice.', 'Le préchargement est en cours. 212 Go par installation — DE-CIX le verra.'],
  ['GTA VI ist released. Willkommen in Leonida.', 'GTA VI is released. Welcome to Leonida.', 'GTA VI est sorti. Bienvenue à Leonida.'],
  ['Webcast ↗', 'Webcast ↗', 'Webdiffusion ↗'],
  ['IR-Meldung ↗', 'IR release ↗', 'Communiqué IR ↗'],
  ['Q2 FY2027', 'Q2 FY2027', 'T2 FY2027'],
  ['Earnings Call', 'Earnings Call', 'Conférence résultats'],
  ['Annual Meeting', 'Annual Meeting', 'Assemblée annuelle'],
  ['Latest 10-Q', 'Latest 10-Q', 'Dernier 10-Q'],
  ['Ergebnisse · Take-Two IR', 'Results · Take-Two IR', 'Résultats · Take-Two IR'],
  ['Webcast · 22:30 CET', 'Webcast · 22:30 CET', 'Webdiffusion · 22:30 CET'],
  ['bereits gelaufen', 'already held', 'déjà tenue'],
  ['kein Filing', 'no filing', 'aucun dépôt'],
  ['Take-Two IR · Press Releases', 'Take-Two IR · Press Releases', 'Take-Two IR · Communiqués'],
  ['Offizielle Meldungen', 'Official announcements', 'Annonces officielles'],
  ['DE-CIX · November-Archiv', 'DE-CIX · November archive', 'DE-CIX · Archives de novembre'],
  ['Yahoo Finance · Konsens', 'Yahoo Finance · Consensus', 'Yahoo Finance · Consensus'],
  ['Hype-Themenradar · Google News RSS', 'Hype topic radar · Google News RSS', 'Radar des sujets hype · Google News RSS'],
  ['Sick Leave Signal', 'Sick Leave Signal', 'Signal arrêts maladie'],
  ['Krankenstand · 7T', 'Sick leave · 7D', 'Arrêts maladie · 7J'],
  ['Arbeitsunfähigkeit · 7T', 'Incapacity · 7D', 'Incapacité · 7J'],
  ['News · 24h', 'News · 24h', 'Actualités · 24h'],
  ['Leading Indicator · 0–100', 'Leading Indicator · 0–100', 'Indicateur avancé · 0–100'],
  ['Pageviews · 7T', 'Pageviews · 7D', 'Pages vues · 7J'],
  ['Concurrent Players', 'Concurrent Players', 'Joueurs simultanés'],
  ['OSINT Composite · 0–100', 'OSINT Composite · 0–100', 'Composite OSINT · 0–100'],
  ['Reddit Members', 'Reddit Members', 'Membres Reddit'],
  ['Keine Schlagzeilen verfügbar.', 'No headlines available.', 'Aucun titre disponible.'],
  ['Reddit-Daten gerade nicht verfügbar.', 'Reddit data currently unavailable.', 'Données Reddit indisponibles.'],
  ['Google Trends liefert gerade keine Daten.', 'Google Trends is not returning data right now.', 'Google Trends ne fournit pas de données pour le moment.'],
  ['GTA trendet aktuell nicht in den DE-Top-10. Hier die Top-Trends:', 'GTA is not trending in the DE top 10 right now. Here are the top trends:', 'GTA n’est pas dans le top 10 allemand actuellement. Voici les tendances :'],
  ['Unauffällig: kein erhöhtes Signal gegenüber dem 7-Tage-Schnitt.', 'Unremarkable: no elevated signal versus the 7-day average.', 'Normal : aucun signal élevé par rapport à la moyenne sur 7 jours.'],
  ['Erhöhtes Signal: Suchvolumen und News liegen deutlich über dem 7-Tage-Schnitt.', 'Elevated signal: search volume and news are clearly above the 7-day average.', 'Signal élevé : le volume de recherche et les actualités dépassent nettement la moyenne sur 7 jours.'],
  ['Leicht erhöht: erste Vorzeichen über dem 7-Tage-Schnitt.', 'Slightly elevated: first signs above the 7-day average.', 'Légèrement élevé : premiers signes au-dessus de la moyenne sur 7 jours.'],
  ['Noch nicht genug Daten für ein Signal.', 'Not enough data for a signal yet.', 'Pas encore assez de données pour un signal.'],
  ['Preorder', 'Preorder', 'Précommande'],
  ['PS5 Preload', 'PS5 Preload', 'Préchargement PS5'],
  ['Xbox Preload', 'Xbox Preload', 'Préchargement Xbox'],
  ['Physical', 'Physical', 'Physique'],
  ['Release', 'Release', 'Lancement'],
  ['Equal-Weight · 30 Tage', 'Equal-Weight · 30 days', 'Équipondéré · 30 jours'],
  ['Base 100 · 30T', 'Base 100 · 30D', 'Base 100 · 30J'],
  ['Tages-Peaks', 'Daily Peaks', 'Pics quotidiens'],
  ['Die höchsten Ausschläge.', 'The highest spikes.', 'Les plus grands pics.'],
  ['Höchster 5-Minuten-Punkt des letzten Tages', 'Highest 5-minute point of the last day', 'Plus haut point de 5 minutes du dernier jour'],
  ['Höchster Tageswert · Proxy', 'Highest daily value · Proxy', 'Plus haute valeur quotidienne · Proxy'],
  ['Community-Größe · Proxy', 'Community size · Proxy', 'Taille de la communauté · Proxy'],
  ['Aktueller Traffic · Peak 21,47 Tbit/s', 'Current traffic · Peak 21.47 Tbit/s', 'Trafic actuel · Pic 21,47 Tbit/s'],
  ['Q2 FY2027 Earnings', 'Q2 FY2027 Earnings', 'Résultats T2 FY2027'],
  ['Latest Filings', 'Latest Filings', 'Derniers dépôts'],
  ['Take-Two IR · Real', 'Take-Two IR · Real', 'Take-Two IR · Réel'],
  ['SEC EDGAR · Real', 'SEC EDGAR · Real', 'SEC EDGAR · Réel'],
  ['Konsens · Yahoo Finance', 'Consensus · Yahoo Finance', 'Consensus · Yahoo Finance'],
  ['Die Q2-Zahlen sind der harte Realitätscheck vor dem Release. Der 19. November bleibt der größte Katalysator — die Guidance entscheidet, wie viel GTA VI schon im Kurs steckt.', 'The Q2 numbers are the hard reality check before the release. 19 November remains the biggest catalyst — guidance decides how much GTA VI is already priced in.', 'Les chiffres du T2 sont le test de réalité avant le lancement. Le 19 novembre reste le principal catalyseur — les prévisions décideront de ce qui est déjà intégré dans le cours.'],
  ['Aktien · Yahoo Finance', 'Stocks · Yahoo Finance', 'Actions · Yahoo Finance'],
  ['OSINT · Wikipedia / News / Reddit / Steam / Trends', 'OSINT · Wikipedia / News / Reddit / Steam / Trends', 'OSINT · Wikipédia / Actualités / Reddit / Steam / Tendances'],
  ['Netzwerk · DE-CIX Frankfurt', 'Network · DE-CIX Frankfurt', 'Réseau · DE-CIX Francfort'],
  ['Reddit · Arctic Shift', 'Reddit · Arctic Shift', 'Reddit · Arctic Shift'],
  ['Steam · GTA V', 'Steam · GTA V', 'Steam · GTA V'],
  ['Google Trends · DE/US', 'Google Trends · DE/US', 'Google Trends · DE/US'],
  ['Rockstar · Endpoint-Probe', 'Rockstar · endpoint probe', 'Rockstar · sonde endpoint'],
  ['DE-CIX · Traffic-API', 'DE-CIX · traffic API', 'DE-CIX · API trafic'],
  ['PlayStation · Preload-Seite', 'PlayStation · preload page', 'PlayStation · page de préchargement'],
  ['Investor · Take-Two IR', 'Investor · Take-Two IR', 'Investisseurs · Take-Two IR'],
  ['SEC EDGAR · Filings', 'SEC EDGAR · Filings', 'SEC EDGAR · Dépôts'],
  ['Yahoo Finance · Konsens', 'Yahoo Finance · Consensus', 'Yahoo Finance · Consensus'],
  ['Hype-Themenradar · Google News RSS', 'Hype topic radar · Google News RSS', 'Radar des sujets hype · Google News RSS'],
  ['ALLE QUELLEN OK', 'ALL SOURCES OK', 'TOUTES LES SOURCES OK'],
  ['© 2026 Huskynarr · Daten: Yahoo Finance, Wikipedia, Google News, Reddit/Arctic Shift, Steam, Google Trends, DE-CIX ·', '© 2026 Huskynarr · Data: Yahoo Finance, Wikipedia, Google News, Reddit/Arctic Shift, Steam, Google Trends, DE-CIX · ', '© 2026 Huskynarr · Données : Yahoo Finance, Wikipédia, Google News, Reddit/Arctic Shift, Steam, Google Trends, DE-CIX · '],

  ['Der erste Blick auf Leonida', 'The first look at Leonida', 'Le premier regard sur Leonida'],
  ['Rockstar zeigt den ersten GTA-VI-Trailer. Innerhalb von 24 Stunden bricht er Rekorde und setzt die Erwartungen für Jahre.', 'Rockstar shows the first GTA VI trailer. Within 24 hours it breaks records and sets expectations for years.', 'Rockstar dévoile la première bande-annonce de GTA VI. En 24 heures, elle bat des records et fixe les attentes pour des années.'],
  ['Take-Two bestätigt Fall 2025', 'Take-Two confirms Fall 2025', 'Take-Two confirme l’automne 2025'],
  ['Der Release wird offiziell für Herbst 2025 angekündigt. Der Markt beginnt, den Termin einzupreisen.', 'The release is officially announced for autumn 2025. The market starts pricing in the date.', 'La sortie est officiellement annoncée pour l’automne 2025. Le marché commence à intégrer la date.'],
  ['Verschiebung auf Mai 2026', 'Delay to May 2026', 'Report à mai 2026'],
  ['Rockstar verschiebt den Release. Die Aktie reagiert, die Community diskutiert — und der Hype bleibt.', 'Rockstar delays the release. The stock reacts, the community debates — and the hype remains.', 'Rockstar reporte la sortie. L’action réagit, la communauté débat — et le hype reste.'],
  ['Neuer Termin: 19. November 2026', 'New date: 19 November 2026', 'Nouvelle date : 19 novembre 2026'],
  ['Die zweite Verschiebung setzt den finalen Release-Termin. Preload und Marketing laufen auf diesen Tag zu.', 'The second delay sets the final release date. Preload and marketing are heading toward this day.', 'Le deuxième report fixe la date de sortie finale. Le préchargement et le marketing convergent vers ce jour.'],
  ['Vorbestellungen öffnen', 'Pre-orders open', 'Ouverture des précommandes'],
  ['Pre-Orders starten weltweit. Standard Edition für 79,99 $, Ultimate Edition für 99,99 $ — inklusive Vintage Vice City Pack.', 'Pre-orders start worldwide. Standard Edition for $79.99, Ultimate Edition for $99.99 — including the Vintage Vice City Pack.', 'Les précommandes commencent dans le monde entier. Édition standard à 79,99 $, édition Ultimate à 99,99 $ — avec le pack Vintage Vice City.'],
  ['212 GB gehen auf die Reise', '212 GB are on their way', '212 Go sont en route'],
  ['PS5-Preload startet um 00:00 lokal, Xbox weltweit um 00:00 GMT. Der DE-CIX und die CDNs werden es merken.', 'PS5 preload starts at 00:00 local time, Xbox worldwide at 00:00 GMT. DE-CIX and the CDNs will notice.', 'Le préchargement PS5 commence à 00:00 heure locale, Xbox dans le monde à 00:00 GMT. DE-CIX et les CDN le remarqueront.'],
  ['Code-in-Box im Handel', 'Code-in-box in stores', 'Code-in-box en boutique'],
  ['Die physische Version mit Download-Code kommt in den Handel. Preload ist damit auch ohne digitale Vorbestellung möglich.', 'The physical version with download code arrives in stores. Preload is therefore possible without a digital pre-order.', 'La version physique avec code de téléchargement arrive en boutique. Le préchargement est donc possible sans précommande numérique.'],
  ['Willkommen in Vice City', 'Welcome to Vice City', 'Bienvenue à Vice City'],
  ['GTA VI erscheint um Mitternacht lokal. Der Moment, auf den der Markt, die Netzwerke und dieses Dashboard gewartet haben.', 'GTA VI launches at local midnight. The moment the market, the networks and this dashboard have been waiting for.', 'GTA VI sort à minuit heure locale. Le moment que le marché, les réseaux et ce tableau de bord attendaient.'],
  ['Prognose', 'Forecast', 'Prévision'],
  ['Delay 1', 'Delay 1', 'Retard 1'],
  ['Delay 2', 'Delay 2', 'Retard 2'],
  ['Preload', 'Preload', 'Préchargement'],
  ['Der Markt preist den Hype.', 'The market is pricing the hype.', 'Le marché intègre déjà le hype.'],
  ['Aktien', 'Stocks', 'Actions'],
  ['Krankenstand', 'Sick Leave', 'Arrêts maladie'],

  ['November Peak', 'November Peak', 'Pic de novembre'],
  ['All-Time Peak', 'All-Time Peak', 'Pic historique'],

  ['Sprache', 'Language', 'Langue'],
  ['Werbung', 'Advertising', 'Publicité'],
  ['GTA V Song', 'GTA V Song', 'GTA V Song'],

  ['GTA VI Key-Art: Lucia und Jason vor Vice-City-Kulisse', 'GTA VI key art: Lucia and Jason against the Vice City skyline', 'Key art GTA VI : Lucia et Jason devant la skyline de Vice City'],
  ['GTA VI Key-Art: Vice City und das Grand-Theft-Auto-Logo', 'GTA VI key art: Vice City and the Grand Theft Auto logo', 'Key art GTA VI : Vice City et le logo Grand Theft Auto'],
  ['GTA VI Key-Art: Leonida und die Welt', 'GTA VI key art: Leonida and the world', 'Key art GTA VI : Leonida et le monde'],

  ['SICK LEAVE', 'SICK LEAVE', 'ARRÊTS MALADIE'],
  ['HYPE SIGNAL', 'HYPE SIGNAL', 'SIGNAL HYPE'],
  ['GTA BASKET', 'GTA BASKET', 'PANIER GTA'],
  ['OSINT COMPOSITE', 'OSINT COMPOSITE', 'COMPOSITE OSINT'],
  ['DE-CIX FRA', 'DE-CIX FRA', 'DE-CIX FRA'],

  ['Yahoo Finance · Real', 'Yahoo Finance · Real', 'Yahoo Finance · Réel'],
  ['Equal-Weight · Proxy', 'Equal-Weight · Proxy', 'Équipondéré · Proxy'],

  ['Noch kein OSINT-Datenstand verfügbar.', 'No OSINT data yet.', 'Pas encore de données OSINT.'],
  ['Noch keine erfolgreiche Erfassung', 'No successful capture yet', 'Aucune capture réussie pour le moment'],
  ['OSINT-Stand:', 'OSINT as of:', 'État OSINT :'],
  ['Stand', 'As of', 'État'],

];

const EN = Object.fromEntries(T.map(([de, en]) => [de, en]));
const FR = Object.fromEntries(T.map(([de, , fr]) => [de, fr]));

const PATTERNS = [
  [/^(\d{1,2})\. November 2026 · 00:00 CET$/, (m) => `November ${m[1]}, 2026 · 00:00 CET`, (m) => `${m[1]} novembre 2026 · 00:00 CET`],
  [/^(\d{1,2})\. November 2026 · 00:00 CET · 212 GB$/, (m) => `November ${m[1]}, 2026 · 00:00 CET · 212 GB`, (m) => `${m[1]} novembre 2026 · 00:00 CET · 212 GB`],
  [/^Released · (\d{1,2})\. November 2026$/, (m) => `Released · November ${m[1]}, 2026`, (m) => `Sorti · ${m[1]} novembre 2026`],
  [/^Aktuell ([\d.,]+) % unter dem All-Time-Peak$/, (m) => `Currently ${m[1]}% below the all-time peak`, (m) => `Actuellement ${m[1]} % sous le pic historique`],
  [/^Aktuell ([\d.,]+) % unter dem 52W-Hoch$/, (m) => `Currently ${m[1]}% below the 52W high`, (m) => `Actuellement ${m[1]} % sous le plus haut 52S`],
  [/^Aktuell ([\d.,]+) % unter dem 90T-Hoch$/, (m) => `Currently ${m[1]}% below the 90D high`, (m) => `Actuellement ${m[1]} % sous le plus haut 90J`],
  [/^(\d+) Tage im Archiv · Real$/, (m) => `${m[1]} days in archive · Real`, (m) => `${m[1]} jours d’archive · Réel`],
  [/^(\d+) TAGE · (\d+) PUNKTE$/, (m) => `${m[1]} DAYS · ${m[2]} POINTS`, (m) => `${m[1]} JOURS · ${m[2]} POINTS`],
  [/^(\d+) Tage · (\d+) Punkte$/, (m) => `${m[1]} days · ${m[2]} points`, (m) => `${m[1]} jours · ${m[2]} points`],
  [/^IN (.+)$/, (m) => `IN ${m[1]}`, (m) => `DANS ${m[1]}`],
  [/^Aktuell · Peak (.+)$/, (m) => `Current · Peak ${m[1]}`, (m) => `Actuel · Pic ${m[1]}`],
  [/^(.+) · 30T High (.+)$/, (m) => `${m[1]} · 30D High ${m[2]}`, (m) => `${m[1]} · 30J High ${m[2]}`],
  [/^30T (.+)$/, (m) => `30D ${m[1]}`, (m) => `30J ${m[1]}`],
  [/^Preorder (.+)$/, (m) => `Preorder ${m[1]}`, (m) => `Précommande ${m[1]}`],
  [/^EPS (.+) · Umsatz (.+)$/, (m) => `EPS ${m[1]} · Revenue ${m[2]}`, (m) => `BPA ${m[1]} · Chiffre d’affaires ${m[2]}`],
  [/^Spanne (.+) · (.+) · (\d+) Analysten$/, (m) => `Range ${m[1]} · ${m[2]} · ${m[3]} analysts`, (m) => `Fourchette ${m[1]} · ${m[2]} · ${m[3]} analystes`],
  [/^PS5 · (.+) · 00:00 lokal$/, (m) => `PS5 · ${m[1]} · 00:00 local`, (m) => `PS5 · ${m[1]} · 00:00 locale`],
  [/^Original-Thread von @(.+) ↗$/, (m) => `Original thread by @${m[1]} ↗`, (m) => `Fil original de @${m[1]} ↗`],
  [/^letztes Update: (.+)$/, (m) => `last update: ${m[1]}`, (m) => `dernière mise à jour : ${m[1]}`],
  [/^OSINT-Stand: (.+) · (.+)$/, (m) => `OSINT as of: ${m[1]} · ${m[2]}`, (m) => `État OSINT : ${m[1]} · ${m[2]}`],
  [/^(.+) Punkte seit (.+) · gleiche Quellenbasis$/, (m) => `${m[1]} points since ${m[2]} · same source base`, (m) => `${m[1]} points depuis ${m[2]} · même base de sources`],
  [/^Stand (.+)$/, (m) => `As of ${m[1]}`, (m) => `État ${m[1]}`],
  [/^100\+ · 7T$/, () => '100+ · 7D', () => '100+ · 7J'],
  [/^(\d+) FILINGS$/, (m) => `${m[1]} FILINGS`, (m) => `${m[1]} DÉPÔTS`],
  [/^(\d+) Artikel in 7T$/, (m) => `${m[1]} articles in 7D`, (m) => `${m[1]} articles en 7J`],
  [/^(.+) Posts\/h · (.+)h Sample$/, (m) => `${m[1]} posts/h · ${m[2]}h sample`, (m) => `${m[1]} posts/h · échantillon ${m[2]}h`],
  [/^(.+) Members$/, (m) => `${m[1]} members`, (m) => `${m[1]} membres`],
  [/^(.+) vs\. Vorwoche$/, (m) => `${m[1]} vs. previous week`, (m) => `${m[1]} vs. semaine précédente`],
  [/^(\d+) vs\. Vorwoche$/, (m) => `${m[1]} vs. previous week`, (m) => `${m[1]} vs. semaine précédente`],
  [/^(\d+) Artikel in 7T$/, (m) => `${m[1]} articles in 7D`, (m) => `${m[1]} articles en 7J`],
  [/^(\d+) QUELLE\(N\) DEGRADED$/, (m) => `${m[1]} SOURCE(S) DEGRADED`, (m) => `${m[1]} SOURCE(S) DÉGRADÉE(S)`],
  [/^1J$/, () => '1Y', () => '1A'],
  [/^30T$/, () => '30D', () => '30J'],
  [/^90T$/, () => '90D', () => '90J'],
  [/^(\d+) Tage · (.+) Punkte$/, (m) => `${m[1]} days · ${m[2]} points`, (m) => `${m[1]} jours · ${m[2]} points`],
];

let language = 'de';
let applying = false;

function normalize(value) {
  return value.replace(/\s+/g, ' ').trim();
}

export function translateString(source, lang = language) {
  if (!source || lang === 'de') return source;
  const clean = normalize(source);
  if (!clean) return source;
  const dict = lang === 'en' ? EN : FR;
  if (dict[clean]) return dict[clean];

  for (const [re, en, fr] of PATTERNS) {
    const match = clean.match(re);
    if (match) return lang === 'en' ? en(match) : fr(match);
  }

  return source;
}

function translateTextNode(node, force = false) {
  if (!node || !node.nodeValue) return;
  if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA'].includes(node.parentElement?.tagName)) return;

  const current = node.nodeValue;
  if (!node.__i18nSource || (!force && node.__i18nLastValue !== current)) {
    node.__i18nSource = current;
  }

  const source = node.__i18nSource;
  const translated = translateString(source, language);
  if (translated !== current) node.nodeValue = translated;
  node.__i18nLastValue = node.nodeValue;
}

function translateAttributes(element, force = false) {
  if (!element?.getAttribute) return;
  if (!element.__i18nAttrs || force) element.__i18nAttrs = {};
  for (const attr of ['title', 'aria-label', 'placeholder', 'alt']) {
    const current = element.getAttribute(attr);
    if (!current) continue;
    if (!(attr in element.__i18nAttrs) || (!force && element.__i18nAttrs[attr] !== current)) {
      element.__i18nAttrs[attr] = current;
    }
    const translated = translateString(element.__i18nAttrs[attr], language);
    if (translated !== current) element.setAttribute(attr, translated);
  }
}

export function translateDom(root = document.body, force = false) {
  if (!root) return;
  applying = true;
  try {
    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root, force);
      return;
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => translateTextNode(node, force));

    const elements = root.querySelectorAll ? root.querySelectorAll('*') : [];
    elements.forEach((element) => translateAttributes(element, force));
  } finally {
    applying = false;
  }
}

function updateButtons() {
  document.querySelectorAll('[data-lang]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.lang === language);
    button.setAttribute('aria-pressed', String(button.dataset.lang === language));
  });
}

export function setLanguage(next) {
  if (!SUPPORTED.includes(next)) return;
  language = next;
  document.documentElement.lang = next;
  localStorage.setItem(STORAGE_KEY, next);
  updateButtons();
  translateDom(document.body, true);
  document.dispatchEvent(new CustomEvent('languagechange', { detail: { language: next } }));
}

export function getLanguage() {
  return language;
}

export function initI18n() {
  const stored = localStorage.getItem(STORAGE_KEY);
  language = SUPPORTED.includes(stored) ? stored : 'de';

  document.documentElement.lang = language;
  updateButtons();
  document.querySelectorAll('[data-lang]').forEach((button) => {
    button.addEventListener('click', () => setLanguage(button.dataset.lang));
  });

  translateDom(document.body, true);

  observer = new MutationObserver((mutations) => {
    if (applying) return;
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => translateDom(node, false));
      } else if (mutation.type === 'characterData') {
        translateTextNode(mutation.target, false);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

let observer = null;
