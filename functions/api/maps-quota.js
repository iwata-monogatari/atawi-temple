const FEATURE_CONFIG = {
  "dynamic-map": {
    capEnv: ["GOOGLE_MAPS_DYNAMIC_MONTHLY_CAP", "MAPS_DYNAMIC_MONTHLY_CAP"],
    disabledEnv: ["GOOGLE_MAPS_DYNAMIC_DISABLED", "MAPS_DYNAMIC_DISABLED"],
  },
};

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {}),
    },
  });
}

function readFirstEnvNumber(env, keys) {
  for (const key of keys) {
    const value = Number(env[key]);
    if (Number.isFinite(value) && value > 0) return Math.floor(value);
  }
  return 0;
}

function readFirstEnvFlag(env, keys) {
  return keys.some((key) => ["1", "true", "yes", "on"].includes(String(env[key] || "").toLowerCase()));
}

function currentPeriod(now = new Date()) {
  return now.toISOString().slice(0, 7);
}

async function ensureTable(db) {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS maps_usage_quota (
      period TEXT NOT NULL,
      feature TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (period, feature)
    )`,
  ).run();
}

async function getUsage(db, period, feature) {
  const row = await db.prepare(
    "SELECT count FROM maps_usage_quota WHERE period = ? AND feature = ?",
  ).bind(period, feature).first();
  return Number(row?.count || 0);
}

async function reserveQuota({ env, feature, consume }) {
  const config = FEATURE_CONFIG[feature];
  if (!config) {
    return { ok: false, status: 400, body: { allowed: false, reason: "unknown_feature", feature } };
  }

  const period = currentPeriod();
  const cap = readFirstEnvNumber(env, config.capEnv);
  const disabled = readFirstEnvFlag(env, config.disabledEnv);

  if (disabled) {
    return { ok: true, body: { allowed: false, reason: "disabled", feature, period, cap, used: null, remaining: 0 } };
  }

  if (cap <= 0) {
    return { ok: true, body: { allowed: false, reason: "cap_not_configured", feature, period, cap, used: null, remaining: 0 } };
  }

  if (!env.ATAWI_BOARD_DB) {
    return { ok: true, body: { allowed: false, reason: "storage_unconfigured", feature, period, cap, used: null, remaining: 0 } };
  }

  const db = env.ATAWI_BOARD_DB;
  const now = new Date().toISOString();
  await ensureTable(db);
  await db.prepare(
    "INSERT INTO maps_usage_quota (period, feature, count, updated_at) VALUES (?, ?, 0, ?) ON CONFLICT(period, feature) DO NOTHING",
  ).bind(period, feature, now).run();

  if (consume) {
    const result = await db.prepare(
      "UPDATE maps_usage_quota SET count = count + 1, updated_at = ? WHERE period = ? AND feature = ? AND count < ?",
    ).bind(now, period, feature, cap).run();
    const used = await getUsage(db, period, feature);
    const allowed = Number(result.meta?.changes || 0) > 0;
    return {
      ok: true,
      body: {
        allowed,
        reason: allowed ? "reserved" : "monthly_cap_reached",
        feature,
        period,
        cap,
        used,
        remaining: Math.max(cap - used, 0),
      },
    };
  }

  const used = await getUsage(db, period, feature);
  return {
    ok: true,
    body: {
      allowed: used < cap,
      reason: used < cap ? "available" : "monthly_cap_reached",
      feature,
      period,
      cap,
      used,
      remaining: Math.max(cap - used, 0),
    },
  };
}

async function readFeature(request) {
  if (request.method === "GET") {
    return new URL(request.url).searchParams.get("feature") || "dynamic-map";
  }
  try {
    const body = await request.json();
    return String(body.feature || "dynamic-map");
  } catch {
    return "dynamic-map";
  }
}

export async function onRequestGet({ request, env }) {
  const feature = await readFeature(request);
  const result = await reserveQuota({ env, feature, consume: false });
  return json(result.body, { status: result.status || 200 });
}

export async function onRequestPost({ request, env }) {
  const feature = await readFeature(request);
  const result = await reserveQuota({ env, feature, consume: true });
  return json(result.body, { status: result.status || 200 });
}
