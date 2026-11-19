// Error monitoring (self-hosted Sentry, project gta-dashboard-web).
// Only on the live domain. The ~3 KB loader fetches the SDK when it is
// needed, so the page stays light on phones. No replay, no tracing, no PII.
(() => {
  if (location.hostname !== 'huskynarr.is-a.dev') return;

  const stripQuery = (url) => (typeof url === 'string' ? url.split(/[?#]/)[0] : url);

  window.sentryOnLoad = () => {
    window.Sentry.init({
      environment: 'production',
      sendDefaultPii: false,
      tracesSampleRate: 0,
      // Only our own code: ignores extensions, YouTube and other third parties.
      allowUrls: [/huskynarr\.is-a\.dev\/gta-dashboard\//],
      ignoreErrors: [/^Script error\.?$/, /ResizeObserver loop/, /Non-Error promise rejection captured/],
      beforeSend(event) {
        if (event.request) {
          event.request.url = stripQuery(event.request.url);
          delete event.request.cookies;
          delete event.request.headers?.Referer;
        }
        return event;
      },
      beforeBreadcrumb(breadcrumb) {
        if (breadcrumb.data?.url) breadcrumb.data.url = stripQuery(breadcrumb.data.url);
        if (breadcrumb.data?.from) breadcrumb.data.from = stripQuery(breadcrumb.data.from);
        if (breadcrumb.data?.to) breadcrumb.data.to = stripQuery(breadcrumb.data.to);
        return breadcrumb;
      },
    });
  };

  const script = document.createElement('script');
  script.src = 'https://logging.gardenpiratez.de/js-sdk-loader/58e942eebf619af38ab65499977a3885.min.js';
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
})();
