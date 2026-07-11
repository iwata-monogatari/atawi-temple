import temples from "../../data/temples.json";
import districts from "../../data/districts.json";

export type Temple = (typeof temples)[number];
export type District = (typeof districts)[number];

export const allTemples = temples;
export const allDistricts = districts;

export function getDistrictById(districtId: string | null | undefined) {
  return allDistricts.find((district) => district.district_id === districtId);
}

export function getDistrictBySlug(slug: string) {
  return allDistricts.find((district) => district.slug === slug);
}

export function getDistrictName(districtId: string | null | undefined) {
  return getDistrictById(districtId)?.name || "地区未確定";
}

export function getTemplesByDistrictId(districtId: string) {
  return allTemples.filter((temple) => temple.district_id === districtId);
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

export function getTempleBySlug(slug: string) {
  return allTemples.find((temple) => temple.slug === slug);
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
      temple.status_label,
      temple.main_deity,
      temple.history_summary,
      temple.sources.map((source) => source.title).join(" "),
    ].join(" "),
  );
}
