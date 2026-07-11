import temples from "../../data/temples.json";

export type Temple = (typeof temples)[number];

export const allTemples = temples;

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
      temple.sect,
      temple.status_label,
      temple.main_deity,
      temple.history_summary,
      temple.sources.map((source) => source.title).join(" "),
    ].join(" "),
  );
}
