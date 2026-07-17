import { access, readFile } from "node:fs/promises";

const temples = JSON.parse(await readFile("data/temples.json", "utf8"));
const districts = JSON.parse(await readFile("data/districts.json", "utf8"));
const templeMedia = JSON.parse(await readFile("data/temple-media.json", "utf8"));
const photoCategories = JSON.parse(await readFile("data/photo-categories.json", "utf8"));
const templeUpdates = JSON.parse(await readFile("data/temple-updates.json", "utf8"));

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
const statusLabels = {
  existing: "現存",
  ruin: "寺院跡・廃寺",
  moved: "移転",
  merged: "統合",
  unknown: "状況不明（現地痕跡未確認）",
};
const relatedReligiousCorporationSect = "その他・関連宗教法人";
const relatedReligiousCorporationSourceSects = new Set([
  "包括宗教法人「神心教」",
  "神心教",
]);
const iwataBounds = {
  minLat: 34.6,
  maxLat: 34.9,
  minLng: 137.7,
  maxLng: 137.95,
};
const deprecatedDataFiles = [
  "data/temples-index.json",
  "data/search-index.json",
  "data/area.json",
  "data/areas.json",
  "data/status.json",
];

function sectGroupName(sect) {
  return relatedReligiousCorporationSourceSects.has(sect) ? relatedReligiousCorporationSect : sect;
}

function hasDetailPage(temple) {
  return temple.detail_page !== false;
}

function hasLatLng(temple) {
  return Number.isFinite(Number(temple.lat)) && Number.isFinite(Number(temple.lng));
}

function inIwataBounds(lat, lng) {
  return lat >= iwataBounds.minLat
    && lat <= iwataBounds.maxLat
    && lng >= iwataBounds.minLng
    && lng <= iwataBounds.maxLng;
}

function publicAssetPath(src) {
  return `public/${src.replace(/^\/+/, "")}`;
}

function countBy(records, keyFn) {
  return records.reduce((counts, record) => {
    const key = keyFn(record);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

checkUnique(temples, "temple_id", "temples");
checkUnique(temples, "slug", "temples");
checkUnique(districts, "district_id", "districts");
checkUnique(districts, "slug", "districts");
checkUnique(photoCategories, "category_id", "photo categories");
checkUnique(templeUpdates, "update_id", "temple updates");

for (const district of districts) {
  const label = `district ${district.district_id || "(missing id)"}`;
  requireText(district, "district_id", label);
  requireText(district, "name", label);
  requireText(district, "slug", label);
  requireText(district, "summary", label);
  requireText(district, "description", label);
  if (district.slug) checkSlug(district.slug, label);
  if (!("hero_image" in district)) {
    errors.push(`${label}: hero_image must be present as a string or null`);
  } else if (district.hero_image === null) {
    if (district.hero_image_alt !== null) {
      errors.push(`${label}: hero_image_alt must be null when hero_image is null`);
    }
  } else if (typeof district.hero_image === "string" && district.hero_image.trim()) {
    requireText(district, "hero_image_alt", label);
    if (!district.hero_image.startsWith("/")) {
      errors.push(`${label}: hero_image must be a root-relative public path`);
    } else {
      try {
        await access(publicAssetPath(district.hero_image));
      } catch {
        errors.push(`${label}: hero_image file is missing: ${district.hero_image}`);
      }
    }
  } else {
    errors.push(`${label}: hero_image must be a non-empty string or null`);
  }
}

for (const file of deprecatedDataFiles) {
  try {
    await access(file);
    errors.push(`data source: deprecated derived JSON must not be used as a source: ${file}`);
  } catch {
    // File is absent, which is the intended state.
  }
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

  if (temple.status && !statusLabels[temple.status]) {
    errors.push(`${label}: status "${temple.status}" has no display label`);
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

  if ("lat" in temple || "lng" in temple) {
    if (!hasLatLng(temple)) {
      errors.push(`${label}: lat/lng must both be numbers when either is present`);
    } else if (!inIwataBounds(Number(temple.lat), Number(temple.lng))) {
      errors.push(`${label}: lat/lng ${temple.lat},${temple.lng} is outside the expected Iwata area`);
    }
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

for (const update of templeUpdates) {
  const label = `temple update ${update.update_id || "(missing id)"}`;
  requireText(update, "update_id", label);
  requireText(update, "date", label);
  requireText(update, "temple_slug", label);
  requireText(update, "title", label);
  requireText(update, "summary", label);
  if (update.temple_slug && !templeSlugs.has(update.temple_slug)) {
    errors.push(`${label}: temple_slug "${update.temple_slug}" is not in data/temples.json`);
  }
  if (update.date && !/^\d{4}-\d{2}-\d{2}$/.test(update.date)) {
    errors.push(`${label}: date must match YYYY-MM-DD format`);
  }
}

const mediaSlugs = new Set(templeMedia.map((media) => media.temple_slug));
for (const temple of temples) {
  const label = `temple ${temple.temple_id || temple.name || "(unknown)"}`;
  const hasPhotos = mediaSlugs.has(temple.slug);
  if (hasPhotos && temple.visit_status !== "現地写真あり") {
    errors.push(`${label}: visit_status must be "現地写真あり" because temple-media has photos`);
  }
  if (!hasPhotos && temple.visit_status === "現地写真あり") {
    errors.push(`${label}: visit_status is "現地写真あり" but temple-media has no photos`);
  }
}

const statusCounts = countBy(temples, (temple) => temple.status);
const statusTotal = Object.values(statusCounts).reduce((total, count) => total + count, 0);
const districtTotal = districts.reduce((total, district) => {
  return total + temples.filter((temple) => temple.district_id === district.district_id).length;
}, 0) + temples.filter((temple) => !temple.district_id).length;
const sectTotal = Object.values(countBy(temples, (temple) => sectGroupName(temple.sect))).reduce((total, count) => total + count, 0);
const detailPageSlugs = temples.filter(hasDetailPage).map((temple) => temple.slug);

if (statusTotal !== temples.length) {
  errors.push(`counts: status total ${statusTotal} does not match temple total ${temples.length}`);
}
if (districtTotal !== temples.length) {
  errors.push(`counts: district total ${districtTotal} does not match temple total ${temples.length}`);
}
if (sectTotal !== temples.length) {
  errors.push(`counts: sect total ${sectTotal} does not match temple total ${temples.length}`);
}
if (new Set(detailPageSlugs).size !== detailPageSlugs.length) {
  errors.push("detail pages: duplicate detail page slug found");
}

const regressionRules = [
  {
    slug: "kindaiji-tenryu",
    expected: {
      district_id: "nanbu",
      area: "南部",
      address: "静岡県磐田市天竜110番地",
    },
  },
  {
    slug: "nipponzan-myohoji-iwata",
    expected: {
      district_id: null,
      area: "地区未確定",
      address: "所在地不明",
      status: "unknown",
      status_label: "所在地・現況不明",
    },
  },
];

const expectedDistrictHeroImages = {
  toyoda: "/images/temples/gyokoji-ikeda/gyokoji-ikeda-03-main-hall.webp",
  koyo: "/assets/temples/zosanji-sagisaka/koyo-banner.webp",
};

const requiredToyodaTempleSlugs = [
  "gyokoji-ikeda",
  "shokoji-miyanoshiki",
  "chionsai-hitokoto",
  "anrakuji-tateno",
  "toyodain-kegojima",
  "shoi-ji-shimoban-no",
  "fukuoji-morimoto",
  "rinshoji-kodateno",
  "kotokuji-morishita",
  "yofukuji-shimohongo",
  "myohoji-ikeda",
  "seidoin-ikeda",
  "daienji-kamo",
  "daizoji-tomei",
];

for (const rule of regressionRules) {
  const temple = temples.find((item) => item.slug === rule.slug);
  if (!temple) {
    errors.push(`regression: required temple "${rule.slug}" is missing`);
    continue;
  }
  for (const [field, expected] of Object.entries(rule.expected)) {
    if (temple[field] !== expected) {
      errors.push(`regression: ${rule.slug}.${field} expected "${expected}" but got "${temple[field]}"`);
    }
  }
}

for (const [districtId, expectedHeroImage] of Object.entries(expectedDistrictHeroImages)) {
  const district = districts.find((item) => item.district_id === districtId);
  if (!district) {
    errors.push(`regression: required district "${districtId}" is missing`);
  } else if (district.hero_image !== expectedHeroImage) {
    errors.push(`regression: ${districtId}.hero_image expected "${expectedHeroImage}" but got "${district.hero_image}"`);
  }
}

for (const slug of requiredToyodaTempleSlugs) {
  const temple = temples.find((item) => item.slug === slug);
  if (!temple) {
    errors.push(`regression: required Toyoda temple "${slug}" is missing`);
  } else if (temple.district_id !== "toyoda") {
    errors.push(`regression: ${slug}.district_id expected "toyoda" but got "${temple.district_id}"`);
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
  console.log(`[OK] ${temples.length} temples, ${districts.length} districts, ${templeMedia.length} media sets, and ${templeUpdates.length} updates validated`);
}
