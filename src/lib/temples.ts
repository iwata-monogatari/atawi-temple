import temples from "../../data/temples.json";
import districts from "../../data/districts.json";
import templeMedia from "../../data/temple-media.json";
import photoCategories from "../../data/photo-categories.json";
import templeUpdates from "../../data/temple-updates.json";

export type Temple = (typeof temples)[number];
export type District = (typeof districts)[number];
export type TempleMedia = (typeof templeMedia)[number];
export type PhotoCategory = (typeof photoCategories)[number];
export type TempleUpdate = (typeof templeUpdates)[number];

export const allTemples = temples;
export const allDistricts = districts;
export const allTempleMedia = templeMedia;
export const allPhotoCategories = photoCategories;
export const allTempleUpdates = [...templeUpdates].sort((a, b) => b.date.localeCompare(a.date));

export const statusLabels: Record<string, string> = {
  existing: "現存",
  ruin: "寺院跡・廃寺",
  moved: "移転",
  merged: "統合",
  unknown: "状況不明（現地痕跡未確認）",
};

export const districtColors: Record<string, string> = {
  mitsuke: "#A9412B",
  nakaizumi: "#008C8C",
  mikuriya: "#B87333",
  toyoda: "#7B4BB2",
  nanbu: "#5BAEC0",
  koyo: "#5F8D3B",
  ryuyo: "#1E5E9F",
  fukude: "#D8D3C5",
  toyooka: "#7A5A36",
  unassigned: "#8c8274",
};

export const relatedReligiousCorporationSect = "その他・関連宗教法人";
export const relatedReligiousCorporationSourceSects = new Set([
  "包括宗教法人「神心教」",
  "神心教",
]);

export const sectSlugMap: Record<string, string> = {
  "真言宗醍醐派": "shingon-daigo",
  "真言宗智山派": "shingon-chisan",
  "新義真言宗": "shingi-shingon",
  "浄土宗": "jodo",
  "浄土真宗本願寺派": "shinshu-honganji",
  "真宗大谷派": "shinshu-otani",
  "真宗高田派": "shinshu-takada",
  "時宗": "ji",
  "臨済宗妙心寺派": "rinzai-myoshinji",
  "臨済宗方広寺派": "rinzai-hokoji",
  "曹洞宗": "soto",
  "日蓮宗": "nichiren",
  "日蓮正宗": "nichiren-shoshu",
  "日本山妙法寺大僧伽": "nipponzan-myohoji",
  [relatedReligiousCorporationSect]: "related-religious-corporations",
  "単立": "independent",
};

export function getSectGroupName(sect: string) {
  return relatedReligiousCorporationSourceSects.has(sect) ? relatedReligiousCorporationSect : sect;
}

export const allSects = Array.from(new Set(allTemples.map((temple) => getSectGroupName(temple.sect)))).map((name) => ({
  name,
  slug: sectSlugMap[name] || normalizeSearchText(name),
}));

export function hasDetailPage(temple: Temple) {
  return !("detail_page" in temple) || temple.detail_page !== false;
}

export function getDistrictById(districtId: string | null | undefined) {
  return allDistricts.find((district) => district.district_id === districtId);
}

export function getDistrictBySlug(slug: string) {
  return allDistricts.find((district) => district.slug === slug);
}

export function getDistrictName(districtId: string | null | undefined) {
  return getDistrictById(districtId)?.name || "地区未確定";
}

export function getDistrictColor(districtId: string | null | undefined) {
  return districtColors[districtId || "unassigned"] || districtColors.unassigned;
}

export function getTemplesByDistrictId(districtId: string) {
  return allTemples.filter((temple) => temple.district_id === districtId);
}

export function getTemplesBySect(sect: string) {
  return allTemples.filter((temple) => getSectGroupName(temple.sect) === sect);
}

export function getSectBySlug(slug: string) {
  return allSects.find((sect) => sect.slug === slug);
}

export function countTemplesBySect() {
  return allSects
    .map((sect) => ({
      ...sect,
      count: getTemplesBySect(sect.name).length,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ja"));
}

export function countTemplesByStatus() {
  return allTemples.reduce<Record<string, number>>((counts, temple) => {
    counts[temple.status] = (counts[temple.status] || 0) + 1;
    return counts;
  }, {});
}

export function countTemplesByDistrict() {
  return allDistricts.map((district) => ({
    ...district,
    count: getTemplesByDistrictId(district.district_id).length,
  }));
}

export function countUnassignedDistrictTemples() {
  return allTemples.filter((temple) => !temple.district_id).length;
}

export function getTempleBySlug(slug: string) {
  return allTemples.find((temple) => temple.slug === slug);
}

export function getTempleMediaBySlug(slug: string) {
  return allTempleMedia.find((media) => media.temple_slug === slug);
}

export function hasTemplePhotos(temple: Temple) {
  const media = getTempleMediaBySlug(temple.slug);
  return Boolean(media?.photos?.length);
}

export function countTemplesWithPhotos() {
  return allTemples.filter(hasTemplePhotos).length;
}

export function getStatusLabel(status: string) {
  return statusLabels[status] || status;
}

export function getTempleStatusLabel(temple: Temple) {
  return getStatusLabel(temple.status);
}

export function getPhotoCategory(categoryId: string | null | undefined) {
  return allPhotoCategories.find((category) => category.category_id === categoryId);
}

export function isUnknownValue(value: string | null | undefined) {
  if (!value) return true;
  return ["未確認", "調査中", "対象外"].includes(value);
}

export function knownValue(value: string | null | undefined, fallback = "確認中") {
  return isUnknownValue(value) ? fallback : value;
}

export function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\s+/g, "");
}

export function templeSearchText(temple: Temple) {
  return normalizeSearchText(
    [
      temple.name,
      temple.name_kana,
      temple.aliases.join(" "),
      temple.address,
      temple.area,
      getDistrictName(temple.district_id),
      temple.sect,
      getSectGroupName(temple.sect),
      getTempleStatusLabel(temple),
      temple.main_deity,
      temple.history_summary,
      "page_summary" in temple ? temple.page_summary : "",
      "visit_notes" in temple ? temple.visit_notes : "",
      "detail_status" in temple ? temple.detail_status : "",
      temple.sources.map((source) => source.title).join(" "),
    ].join(" "),
  );
}

export function getTempleLatLng(temple: Temple) {
  const lat = Number("lat" in temple ? temple.lat : NaN);
  const lng = Number("lng" in temple ? temple.lng : NaN);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export function templeMapQuery(temple: Temple) {
  const latLng = getTempleLatLng(temple);
  if (latLng) return `${latLng.lat},${latLng.lng}`;
  return [temple.name, temple.address, "静岡県磐田市"].filter(Boolean).join(" ");
}

export function googleMapsUrl(temple: Temple) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(templeMapQuery(temple))}`;
}

export function googleMapsEmbedUrl(temple: Temple, apiKey: string | undefined) {
  if (!apiKey) return null;
  return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(templeMapQuery(temple))}`;
}

export const iwataTempleMapQuery = "静岡県磐田市 寺院";

export function googleMapsWebEmbedUrl(query: Temple | string = iwataTempleMapQuery) {
  const resolvedQuery = typeof query === "string" ? query : templeMapQuery(query);
  return `https://www.google.com/maps?q=${encodeURIComponent(resolvedQuery)}&output=embed`;
}
