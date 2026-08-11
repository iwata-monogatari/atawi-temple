// 目的別検索。掲載済みデータから「その目的で探せる寺院」を機械的に抽出する。
// 掲載が確認できない寺院は該当なしとして扱い、推測で目的を付与しない。
//
// 判定方針:
//  - 構造化データ（年中行事、指定文化財）で確実に分かるものは構造で判定する。
//  - 本文からの判定は「文単位」で行い、「未確認」「調査中」などの留保を含む文は除外する。
//    facts側のworship_guide.visit_notes / pendingは留保の記述が中心のため本文判定に使わない。
import { allTemples, hasDetailPage, isUnknownValue, type Temple } from "./temples";
import { getRefurbFacts } from "./refurb";

export interface TemplePurpose {
  id: string;
  label: string;
  /** 目的別カードに出す説明 */
  description: string;
  /** 本文（肯定文）からの判定パターン。構造判定のみの目的はnull */
  pattern: RegExp | null;
  /** 構造化データから確実に判定できる場合の条件 */
  structural?: (temple: Temple) => boolean;
  /** 現在利用できるかを問う目的は、現存寺院に限る（廃寺の記述で拾わない） */
  existingOnly?: boolean;
}

/** 留保・未確認を示す文は目的判定から除外する */
const NEGATION_PATTERN =
  /未確認|未掲載|未定|確認でき(?:な|ず|ませ|て)|確認されて|確認中|調査中|ありません|存在しない|不明|見合わせ|対象外|要確認|ご確認ください|お問い合わせください|参考情報|推測|今後確認|必要があります|課題として|検証が必要|かどうかは別/;

function sentences(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text
    .split(/[。\n"]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

const corpusCache = new Map<string, string[]>();

/** 肯定文のみを集めた判定用コーパス */
function affirmativeSentences(temple: Temple): string[] {
  const cached = corpusCache.get(temple.slug);
  if (cached) return cached;

  const record = temple as Record<string, unknown>;
  const facts = getRefurbFacts(temple.slug) as Record<string, unknown> | null;
  const parts: unknown[] = [
    record.history_summary,
    record.page_summary,
    record.pilgrimage_note,
    record.aliases,
    record.cultural_assets,
    record.historical_sections,
    record.danka_info,
    facts?.lead,
    facts?.about,
    facts?.history_sections,
    facts?.cultural_assets,
    facts?.community,
    facts?.faq,
  ];

  const result = parts
    .flatMap((part) => sentences(part))
    .filter((sentence) => !NEGATION_PATTERN.test(sentence));
  corpusCache.set(temple.slug, result);
  return result;
}

function annualEvents(temple: Temple) {
  const danka = (temple as Record<string, any>).danka_info;
  const fromTemple = Array.isArray(danka?.annual_events) ? danka.annual_events : [];
  const fromFacts = getRefurbFacts(temple.slug)?.worship_guide?.annual_events || [];
  return [...fromTemple, ...fromFacts];
}

function culturalAssets(temple: Temple) {
  const fromTemple = Array.isArray((temple as Record<string, any>).cultural_assets)
    ? (temple as Record<string, any>).cultural_assets
    : [];
  const fromFacts = getRefurbFacts(temple.slug)?.cultural_assets || [];
  return [...fromTemple, ...fromFacts];
}

// factsのcultural_assetsは「境内の見どころ」「現地確認情報」も含むため、
// 文化財としての判定は指定の記載があるものに限る。
const DESIGNATION_PATTERN = /指定|重要文化財|史跡|天然記念物|登録有形|国宝/;

function designatedAssets(temple: Temple) {
  return culturalAssets(temple).filter((asset: any) =>
    DESIGNATION_PATTERN.test(`${asset?.designation || ""} ${asset?.name || ""}`),
  );
}

export const templePurposes: TemplePurpose[] = [
  {
    id: "houyou",
    label: "法要をしたい",
    description: "年中行事・法要の掲載がある寺院です。受付の可否と日程は寺院へご確認ください。",
    // 一般名詞の「法要」は留保付きの文にも頻出するため、行事名か構造化データで判定する
    pattern: /施餓鬼|彼岸会|盂蘭盆|盆会|棚経|報恩講|涅槃会|花まつり|灌仏会|開山忌|年忌法要|回忌法要/,
    structural: (temple) => annualEvents(temple).length > 0,
    existingOnly: true,
  },
  {
    id: "nokotsu",
    label: "納骨したい",
    description: "納骨に関する記載が確認できた寺院です。受入条件は寺院へご確認ください。",
    pattern: /納骨/,
    existingOnly: true,
  },
  {
    id: "eitaikuyo",
    label: "永代供養",
    description: "永代供養・永代経などの記載が確認できた寺院です。",
    // 「合祀・合葬」は神社合祀（明治期の神社整理）の歴史記述に多く、寺院の供養形態と紛れるため使わない
    pattern: /永代供養|永代納骨|永代経|樹木葬/,
    existingOnly: true,
  },
  {
    id: "bochi",
    label: "墓地がある寺院",
    description: "境内墓地・寺院墓地の記載が確認できた寺院です。",
    // 「墓所・墓域」は「◯◯（人物）の墓所」という history 記述に多く、参拝者が使える墓地の有無とは別物
    pattern: /墓地|墓苑|霊園/,
    existingOnly: true,
  },
  // 「御朱印」は現行データでは江戸期の朱印地（「御朱印弐石」など寺領の石高）を指す用例しかなく、
  // 参拝者が受ける御朱印の掲載が確認できないため目的から外している。授与情報が揃ったら
  // pattern: /御朱印(?!\s*[〇一二三四五六七八九十百千弐参壱]+\s*石)|朱印帳|納経帳/ のような形で復活させる。
  {
    id: "bunkazai",
    label: "文化財",
    description: "国・県・市の指定文化財、史跡などの掲載がある寺院です。",
    pattern: null,
    structural: (temple) =>
      designatedAssets(temple).length > 0 ||
      !isUnknownValue((temple as Record<string, any>).heritage_status),
  },
];

export const purposeById = new Map(templePurposes.map((purpose) => [purpose.id, purpose]));

export function getPurposeById(id: string | null | undefined) {
  return id ? purposeById.get(id) || null : null;
}

export function getTemplePurposeIds(temple: Temple): string[] {
  const corpus = affirmativeSentences(temple);
  const isExisting = (temple as Record<string, unknown>).status === "existing";
  return templePurposes
    .filter((purpose) => {
      if (purpose.existingOnly && !isExisting) return false;
      if (purpose.structural?.(temple)) return true;
      if (!purpose.pattern) return false;
      return corpus.some((sentence) => purpose.pattern!.test(sentence));
    })
    .map((purpose) => purpose.id);
}

export function countTemplesByPurpose() {
  const counts = new Map<string, number>(templePurposes.map((purpose) => [purpose.id, 0]));
  for (const temple of allTemples) {
    if (!hasDetailPage(temple)) continue;
    for (const id of getTemplePurposeIds(temple)) {
      counts.set(id, (counts.get(id) || 0) + 1);
    }
  }
  return templePurposes.map((purpose) => ({ ...purpose, count: counts.get(purpose.id) || 0 }));
}

export function purposeSearchUrl(id: string) {
  return `/search/?purpose=${encodeURIComponent(id)}`;
}
