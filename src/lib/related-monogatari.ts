import relatedMonogatari from "../../data/related-monogatari.json";
import siteConfig from "../../data/site-config.json";

export type MonogatariRelation = "direct" | "topic" | "area";

export interface MonogatariLink {
  url: string;
  title: string;
  relation: MonogatariRelation;
  note?: string;
}

const relationLabels: Record<MonogatariRelation, string> = {
  direct: "この寺院の記事",
  topic: "ゆかりの記事",
  area: "地域の記事",
};

const templeLinks: Record<string, MonogatariLink[]> = relatedMonogatari.temples as Record<string, MonogatariLink[]>;
const districtLinks: Record<string, string> = relatedMonogatari.districts as Record<string, string>;

export function getMonogatariLinksBySlug(slug: string): MonogatariLink[] {
  return templeLinks[slug] || [];
}

export function getMonogatariDistrictUrl(districtId: string | null | undefined): string | null {
  if (!districtId) return null;
  return districtLinks[districtId] || null;
}

export function getMonogatariRelationLabel(relation: MonogatariRelation): string {
  return relationLabels[relation] || "";
}

export const realEstateFunnel = siteConfig.real_estate_funnel;
