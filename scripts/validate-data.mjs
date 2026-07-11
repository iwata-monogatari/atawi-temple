import { readFile } from "node:fs/promises";

const temples = JSON.parse(await readFile("data/temples.json", "utf8"));
const districts = JSON.parse(await readFile("data/districts.json", "utf8"));
const templeMedia = JSON.parse(await readFile("data/temple-media.json", "utf8"));
const photoCategories = JSON.parse(await readFile("data/photo-categories.json", "utf8"));

const errors = [];
const warnings = [];

function requireText(record, field, label) {
  if (typeof record[field] !== "string" || record[field].trim() === "") {
    errors.push(`${label}: ${field} is required`);
  }
}

function checkUnique(records, field, label) {
  const seen = new Map();
  for (const record of records) {
    const value = record[field];
    if (!value) continue;
    if (seen.has(value)) {
      errors.push(`${label}: duplicate ${field} "${value}"`);
      continue;
    }
    seen.set(value, record);
  }
}

function checkSlug(value, label) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    errors.push(`${label}: slug "${value}" must use lowercase ASCII letters, numbers, and single hyphens`);
  }
}

const districtIds = new Set(districts.map((district) => district.district_id));
const templeSlugs = new Set(temples.map((temple) => temple.slug));
const photoCategoryIds = new Set(photoCategories.map((category) => category.category_id));
const allowedStatuses = new Set([
  "existing",
  "ruin",
  "moved",
  "merged",
  "unknown",
]);
const allowedRecordTypes = new Set(["temple", "ruin", "hall", "pilgrimage"]);

checkUnique(temples, "temple_id", "temples");
checkUnique(temples, "slug", "temples");
checkUnique(districts, "district_id", "districts");
checkUnique(districts, "slug", "districts");
checkUnique(photoCategories, "category_id", "photo categories");

for (const district of districts) {
  const label = `district ${district.district_id || "(missing id)"}`;
  requireText(district, "district_id", label);
  requireText(district, "name", label);
  requireText(district, "slug", label);
  requireText(district, "summary", label);
  if (district.slug) checkSlug(district.slug, label);
}

for (const temple of temples) {
  const label = `temple ${temple.temple_id || temple.name || "(unknown)"}`;

  requireText(temple, "temple_id", label);
  requireText(temple, "slug", label);
  requireText(temple, "name", label);
  requireText(temple, "name_kana", label);
  requireText(temple, "record_type", label);
  requireText(temple, "status", label);
  requireText(temple, "status_label", label);
  requireText(temple, "sect", label);
  requireText(temple, "address", label);
  requireText(temple, "area", label);
  requireText(temple, "last_verified_at", label);

  if (temple.slug) checkSlug(temple.slug, label);

  if (!/^iwata-\d{4}$/.test(temple.temple_id || "")) {
    errors.push(`${label}: temple_id must match iwata-0001 format`);
  }

  if (!allowedRecordTypes.has(temple.record_type)) {
    errors.push(`${label}: record_type "${temple.record_type}" is not allowed`);
  }

  if (!allowedStatuses.has(temple.status)) {
    errors.push(`${label}: status "${temple.status}" is not allowed`);
  }

  if (temple.district_id !== null && temple.district_id !== undefined && !districtIds.has(temple.district_id)) {
    errors.push(`${label}: district_id "${temple.district_id}" is not in data/districts.json`);
  }

  if (temple.district_id === null && temple.area !== "地区未確定") {
    warnings.push(`${label}: district_id is null, consider setting area to "地区未確定"`);
  }

  if (!Array.isArray(temple.aliases)) {
    errors.push(`${label}: aliases must be an array`);
  }

  if (!Array.isArray(temple.sources) || temple.sources.length === 0) {
    warnings.push(`${label}: sources should include at least one source`);
  }
}

for (const category of photoCategories) {
  const label = `photo category ${category.category_id || "(missing id)"}`;
  requireText(category, "category_id", label);
  requireText(category, "label", label);
  requireText(category, "description", label);
  if (category.category_id) checkSlug(category.category_id, label);
}

for (const media of templeMedia) {
  const label = `temple media ${media.temple_slug || "(missing slug)"}`;
  requireText(media, "temple_slug", label);
  requireText(media, "hero_image", label);

  if (!templeSlugs.has(media.temple_slug)) {
    errors.push(`${label}: temple_slug is not in data/temples.json`);
  }

  if (!Array.isArray(media.photos) || media.photos.length === 0) {
    errors.push(`${label}: photos must be a non-empty array`);
    continue;
  }

  checkUnique(media.photos, "photo_id", label);

  for (const photo of media.photos) {
    const photoLabel = `${label} photo ${photo.photo_id || "(missing id)"}`;
    requireText(photo, "photo_id", photoLabel);
    requireText(photo, "src", photoLabel);
    requireText(photo, "alt", photoLabel);
    requireText(photo, "caption", photoLabel);
    requireText(photo, "category_id", photoLabel);
    requireText(photo, "status", photoLabel);
    if (photo.category_id && !photoCategoryIds.has(photo.category_id)) {
      errors.push(`${photoLabel}: category_id "${photo.category_id}" is not in data/photo-categories.json`);
    }
  }
}

for (const warning of warnings) {
  console.warn(`[WARN] ${warning}`);
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`[NG] ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(`[OK] ${temples.length} temples, ${districts.length} districts, and ${templeMedia.length} media sets validated`);
}
