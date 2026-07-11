const DEFAULT_ORIGIN =
  "https://fujigaoka-analytics-worker.hiroyukio0122.workers.dev";

const origin = (
  import.meta.env.PUBLIC_FUJIGAOKA_ANALYTICS_ORIGIN || DEFAULT_ORIGIN
).replace(/\/+$/, "");

export const analyticsConfig = Object.freeze({
  enabled:
    import.meta.env.PROD &&
    import.meta.env.PUBLIC_FUJIGAOKA_ANALYTICS_ENABLED !== "false",
  siteId: import.meta.env.PUBLIC_FUJIGAOKA_ANALYTICS_SITE_ID || "atawi-temple",
  origin,
  trackerUrl: `${origin}/tracker.js`,
  dashboardUrl: `${origin}/`,
});
