// 2026-07-19 全面改修: 寺院別factsファイル（data/temples/<slug>.json）の読み込みと
// 宗派・本尊共通モジュールの解決。factsが存在する寺院は新構成（01〜09）で描画される。
import sectModulesRaw from "../../data/modules/sect-modules.json";
import deityModulesRaw from "../../data/modules/deity-modules.json";

export interface ModuleSource {
  title: string;
  type?: string;
  url?: string;
  note?: string;
}

export interface ContentModule {
  id: string;
  name: string;
  match?: string[];
  body: string[];
  sources?: ModuleSource[];
}

export interface RefurbFacts {
  slug: string;
  grade: "T1" | "T2" | "T3";
  last_verified_at?: string;
  lead: string;
  about: string[];
  history_sections: { heading: string; body: string }[];
  cultural_assets?: { designation?: string; name: string; summary: string }[];
  sect_deity?: {
    sect_module_id?: string | null;
    deity_module_id?: string | null;
    intro: string;
  };
  community?: { body?: string[]; ruin_note?: string };
  worship_guide?: {
    annual_events?: { name: string; timing?: string; note?: string }[];
    visit_notes?: string[];
    pending?: string[];
  };
  faq?: { q: string; a: string; anchor?: string }[];
  sources?: ModuleSource[];
  research_todos?: string[];
}

const sectModules = sectModulesRaw as unknown as ContentModule[];
const deityModules = deityModulesRaw as unknown as ContentModule[];

const factsFiles = import.meta.glob<{ default: RefurbFacts }>("../../data/temples/*.json", {
  eager: true,
});

const factsBySlug = new Map<string, RefurbFacts>();
for (const [path, mod] of Object.entries(factsFiles)) {
  const facts = mod.default;
  const slug = facts.slug || path.split("/").pop()!.replace(/\.json$/, "");
  factsBySlug.set(slug, facts);
}

export function getRefurbFacts(slug: string): RefurbFacts | null {
  return factsBySlug.get(slug) || null;
}

export function countRefurbFacts(): number {
  return factsBySlug.size;
}

export function allRefurbFacts(): RefurbFacts[] {
  return [...factsBySlug.values()];
}

export function getSectModule(id: string | null | undefined): ContentModule | null {
  if (!id) return null;
  return sectModules.find((m) => m.id === id) || null;
}

export function getDeityModule(id: string | null | undefined): ContentModule | null {
  if (!id) return null;
  return deityModules.find((m) => m.id === id) || null;
}

export const gradeLabels: Record<string, string> = {
  T1: "充実",
  T2: "標準",
  T3: "基礎情報",
};

export function getGradeLabel(grade: string): string {
  return gradeLabels[grade] || grade;
}
