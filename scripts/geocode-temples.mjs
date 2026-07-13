import { readFile, writeFile } from "node:fs/promises";

const TEMPLES_PATH = "data/temples.json";
const API_KEY = process.env.GOOGLE_MAPS_GEOCODING_KEY;
const SHOULD_WRITE = process.argv.includes("--write");
const LIMIT = Number(process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1] || Infinity);
const IWATA_BOUNDS = {
  minLat: 34.6,
  maxLat: 34.9,
  minLng: 137.7,
  maxLng: 137.95,
};

if (!API_KEY) {
  console.error("[NG] GOOGLE_MAPS_GEOCODING_KEY is required.");
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function inIwataBounds(lat, lng) {
  return lat >= IWATA_BOUNDS.minLat
    && lat <= IWATA_BOUNDS.maxLat
    && lng >= IWATA_BOUNDS.minLng
    && lng <= IWATA_BOUNDS.maxLng;
}

function hasLatLng(temple) {
  return Number.isFinite(Number(temple.lat)) && Number.isFinite(Number(temple.lng));
}

function geocodeQuery(temple) {
  return [temple.name, temple.address, "静岡県磐田市"].filter(Boolean).join(" ");
}

async function geocode(temple) {
  const params = new URLSearchParams({
    address: geocodeQuery(temple),
    region: "jp",
    language: "ja",
    key: API_KEY,
  });
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

const temples = JSON.parse(await readFile(TEMPLES_PATH, "utf8"));
const targets = temples
  .filter((temple) => !hasLatLng(temple))
  .filter((temple) => temple.address && temple.address !== "所在地不明")
  .slice(0, LIMIT);

const review = [];
let updated = 0;

for (const temple of targets) {
  const result = await geocode(temple);
  if (result.status !== "OK" || !result.results?.[0]) {
    review.push({ slug: temple.slug, name: temple.name, status: result.status, reason: "no_result" });
    console.warn(`[WARN] ${temple.slug}: ${result.status}`);
    await sleep(120);
    continue;
  }

  const first = result.results[0];
  const lat = first.geometry?.location?.lat;
  const lng = first.geometry?.location?.lng;
  const locationType = first.geometry?.location_type || "UNKNOWN";

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !inIwataBounds(lat, lng)) {
    review.push({ slug: temple.slug, name: temple.name, status: result.status, locationType, lat, lng, reason: "out_of_bounds" });
    console.warn(`[WARN] ${temple.slug}: out of bounds ${lat},${lng}`);
    await sleep(120);
    continue;
  }

  temple.lat = Number(lat.toFixed(7));
  temple.lng = Number(lng.toFixed(7));
  temple.geocoding = {
    provider: "google",
    query: geocodeQuery(temple),
    formatted_address: first.formatted_address,
    location_type: locationType,
    checked_at: new Date().toISOString().slice(0, 10),
  };
  updated += 1;

  if (locationType !== "ROOFTOP") {
    review.push({ slug: temple.slug, name: temple.name, status: result.status, locationType, lat: temple.lat, lng: temple.lng, reason: "needs_review" });
  }

  console.log(`[OK] ${temple.slug}: ${temple.lat},${temple.lng} ${locationType}`);
  await sleep(120);
}

if (SHOULD_WRITE) {
  await writeFile(TEMPLES_PATH, `${JSON.stringify(temples, null, 2)}\n`, "utf8");
  console.log(`[OK] wrote ${updated} geocoded records to ${TEMPLES_PATH}`);
} else {
  console.log(`[DRY RUN] ${updated} records geocoded. Re-run with --write to save.`);
}

if (review.length > 0) {
  console.log("[REVIEW]");
  console.log(JSON.stringify(review, null, 2));
}
