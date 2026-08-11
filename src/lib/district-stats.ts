// 地区別の人口・高齢化率・空き家率。未確認の数値はnullのまま「調査中」と表示する。
import districtStats from "../../data/district-stats.json";
import { getTemplesByDistrictId, hasDetailPage } from "./temples";

export interface DistrictStats {
  population: number | null;
  households: number | null;
  aging_rate: number | null;
  vacant_house_rate: number | null;
  as_of: string | null;
  source: string | null;
  jikka_note: string | null;
}

const statsByDistrictId = districtStats.districts as unknown as Record<string, DistrictStats>;

export const PENDING_LABEL = "調査中";

export function getDistrictStats(districtId: string | null | undefined): DistrictStats | null {
  if (!districtId) return null;
  return statsByDistrictId[districtId] || null;
}

export function formatCount(value: number | null | undefined, unit: string) {
  return typeof value === "number" ? `${value.toLocaleString("ja-JP")}${unit}` : PENDING_LABEL;
}

export function formatRate(value: number | null | undefined) {
  return typeof value === "number" ? `${value}%` : PENDING_LABEL;
}

/** 統計の基準時点と出典。未設定なら想定している出典名だけを返す。 */
export function statsSourceNote(stats: DistrictStats | null) {
  if (stats?.source) {
    return stats.as_of ? `${stats.source}（${stats.as_of}時点）` : stats.source;
  }
  return "人口・高齢化率・空き家率は、磐田市統計書、国勢調査、住宅・土地統計調査から確認できた数値のみを掲載します。確認前の項目は調査中と表示しています。";
}

export function countDistrictTemples(districtId: string) {
  const temples = getTemplesByDistrictId(districtId);
  return {
    total: temples.length,
    detailed: temples.filter(hasDetailPage).length,
    existing: temples.filter((temple) => temple.status === "existing").length,
  };
}
