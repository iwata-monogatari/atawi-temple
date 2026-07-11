const origin =
  process.env.PUBLIC_FUJIGAOKA_ANALYTICS_ORIGIN ||
  "https://fujigaoka-analytics-worker.hiroyukio0122.workers.dev";

const normalizedOrigin = origin.replace(/\/+$/, "");

const targets = [
  {
    name: "dashboard",
    url: `${normalizedOrigin}/`,
    expected: /text\/html/i,
  },
  {
    name: "tracker",
    url: `${normalizedOrigin}/tracker.js`,
    expected: /(javascript|ecmascript|text\/plain)/i,
  },
];

let failed = false;

for (const target of targets) {
  try {
    const response = await fetch(target.url, {
      headers: { "user-agent": "atawi-temple-health-check/1.0" },
    });
    const contentType = response.headers.get("content-type") || "";

    if (!response.ok || !target.expected.test(contentType)) {
      failed = true;
      console.error(
        `[NG] ${target.name}: status=${response.status}, content-type=${contentType}`,
      );
      continue;
    }

    console.log(
      `[OK] ${target.name}: status=${response.status}, content-type=${contentType}`,
    );
  } catch (error) {
    failed = true;
    console.error(`[NG] ${target.name}:`, error);
  }
}

process.exitCode = failed ? 1 : 0;
