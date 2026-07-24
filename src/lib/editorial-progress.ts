import { allTemples, getDistrictName, hasDetailPage } from "./temples";

export type EditorialStatus = "planned" | "researching" | "drafting" | "reviewing" | "published";

export type EditorialProgressItem = {
  id: string;
  kind: "pillar" | "temple";
  title: string;
  templeName?: string;
  district?: string;
  angle?: string;
  status: EditorialStatus;
  characterCount: number;
  illustrationCount: number;
  sourceCount: number;
  href?: string;
  updatedAt?: string;
};

export const editorialStatusLabels: Record<EditorialStatus, string> = {
  planned: "企画",
  researching: "調査",
  drafting: "執筆",
  reviewing: "校閲",
  published: "公開",
};

const pillarTitles = [
  "磐田市の寺院史をどう読むか――古代寺院から現代寺院まで",
  "磐田市の寺院分布――九地区と地形・街道・集落の関係",
  "遠江国府と寺院――見付に重なる政治・宗教空間",
  "遠江国分寺の成立と変容――古代国家仏教の地域的展開",
  "磐田市の廃寺と寺院跡――失われた宗教空間を復元する",
  "東海道見付宿と寺院――宿場町の葬送・祈願・地域秩序",
  "天竜川と磐田の寺院――水害・渡河・治水の歴史",
  "遠州灘沿岸の寺院――漁業・海上安全・津波伝承",
  "磐田原台地の寺院――古墳・集落・信仰景観",
  "磐田市の山寺と里寺――立地からみる寺院の機能",
  "磐田市の曹洞宗寺院――本末関係と地域的展開",
  "磐田市の臨済宗寺院――妙心寺派・方広寺派の系譜",
  "磐田市の浄土宗寺院――念仏信仰と近世地域社会",
  "磐田市の真宗寺院――門徒組織と家の継承",
  "磐田市の日蓮宗寺院――法華信仰と地域ネットワーク",
  "磐田市の時宗寺院――中世交通路と遊行の記憶",
  "磐田市の真言宗寺院――密教・修験・霊場の重層性",
  "磐田市の寺院本尊――尊像から読む地域信仰",
  "薬師如来信仰と磐田――病気平癒と地域医療の前史",
  "観音信仰と磐田――札所・女性・村落の祈り",
  "地蔵信仰と磐田――道・境界・子どもを守る仏",
  "阿弥陀信仰と磐田――来世観と葬送儀礼",
  "虚空蔵菩薩信仰と磐田――知恵・十三参り・地域伝承",
  "不動明王信仰と磐田――修験と村落鎮護",
  "磐田市の寺院文化財――指定制度と地域資料の保存",
  "磐田市の仏像――年代・様式・伝承をどう区別するか",
  "磐田市の寺院建築――本堂・山門・鐘楼の比較研究",
  "磐田市の寺院庭園――景観・植栽・水系の文化史",
  "磐田市の寺院樹木――イチョウ・ソテツ・巨木信仰",
  "磐田市の梵鐘と鐘楼――音が形成した地域空間",
  "寺院墓地から読む磐田――家・村・移動の歴史",
  "磐田市の石仏と石塔――造立銘から地域社会を読む",
  "磐田市の寺子屋と近代教育――寺院から学校への連続",
  "磐田市の寺院と徳川家康――伝承と史料の境界",
  "磐田市の寺院と武田・徳川抗争――戦火と復興",
  "磐田市の寺院と安政東海地震――被害・再建・記憶",
  "磐田市の寺院と戦争――供養塔・忠魂碑・地域記憶",
  "磐田市の寺院と祭礼――神仏習合の地域構造",
  "磐田市の寺院と自治会――共同体運営の歴史的基盤",
  "磐田市の寺院と女性――信仰・講・家族継承",
  "磐田市の寺院と高齢社会――檀家・墓・介護の接点",
  "磐田市の寺院と空き家問題――家の継承を分けて考える",
  "磐田市の寺院と墓じまい――歴史・制度・合意形成",
  "磐田市の寺院と永代供養――現代的需要と宗教的意味",
  "菩提寺が分からないとき――磐田で寺院を確認する史料的方法",
  "磐田市の寺院名と地名――同名寺院・旧村名の識別",
  "寺院史料の読み方――郡誌・町史・宗派資料の比較",
  "寺伝を検証する――伝承・公的記録・現地確認の方法",
  "寺院写真を地域資料にする――撮影・記録・公開倫理",
  "磐田の寺院データベース論――地域知を継承するデジタル郷土史",
];

const templeAngles = [
  { key: "history", label: "史料と沿革" },
  { key: "heritage", label: "文化財・建築・景観" },
  { key: "community", label: "地域社会・信仰・現代的役割" },
] as const;

const existingTemples = allTemples.filter(
  (temple) => temple.status === "existing" && hasDetailPage(temple),
);

export const pillarProgressItems: EditorialProgressItem[] = pillarTitles.map((title, index) => ({
  id: `pillar-${String(index + 1).padStart(2, "0")}`,
  kind: "pillar",
  title,
  status: "planned",
  characterCount: 0,
  illustrationCount: 0,
  sourceCount: 0,
}));

export const templeProgressItems: EditorialProgressItem[] = existingTemples.flatMap((temple) =>
  templeAngles.map((angle) => {
    const kokubunjiPublications = {
      history: {
        title: "遠江国分寺の成立と空間構成",
        characterCount: 6196,
        illustrationCount: 4,
        sourceCount: 6,
        href: "/research/totomi-kokubunji-state-buddhism/",
      },
      heritage: {
        title: "遠江国分寺跡の発掘・保存・公共史",
        characterCount: 6003,
        illustrationCount: 4,
        sourceCount: 6,
        href: "/research/kokubunji-archaeology-conservation-public-history/",
      },
      community: {
        title: "遠江国分寺における継承と断絶",
        characterCount: 6029,
        illustrationCount: 4,
        sourceCount: 7,
        href: "/research/kokubunji-continuity-and-discontinuity/",
      },
    } as const;
    const iojiPublications = {
      history: {
        title: "鎌田山医王寺の歴史叙述と史料層位",
        characterCount: 6006,
        illustrationCount: 4,
        sourceCount: 6,
        href: "/research/ioji-kamada-history-documentary-layers/",
      },
      heritage: {
        title: "医王寺庭園及び参道の文化的景観",
        characterCount: 6599,
        illustrationCount: 4,
        sourceCount: 7,
        href: "/research/ioji-kamada-garden-approach-cultural-landscape/",
      },
      community: {
        title: "医王寺と御厨地域の公共圏",
        characterCount: 6415,
        illustrationCount: 4,
        sourceCount: 7,
        href: "/research/ioji-kamada-community-faith-public-memory/",
      },
    } as const;
    const daijoinHistoryPublication = {
      title: "大乗院三仭坊の形成と制度的重層",
      characterCount: 6277,
      illustrationCount: 4,
      sourceCount: 7,
      href: "/research/daijoin-mihirobo-history-institutional-layers/",
    } as const;
    const daijoinHeritagePublication = {
      title: "庚申塚古墳上に形成された大乗院三仭坊の境内景観",
      characterCount: 6075,
      illustrationCount: 6,
      sourceCount: 7,
      href: "/research/daijoin-koshinzuka-kofun-layered-cultural-landscape/",
    } as const;
    const daijoinCommunityPublication = {
      title: "大乗院三仭坊における祈願・供養・地域公共圏",
      characterCount: 6689,
      illustrationCount: 5,
      sourceCount: 8,
      href: "/research/daijoin-mihirobo-community-ritual-public-space/",
    } as const;
    const zosanjiHistoryPublication = {
      title: "岩田山増参寺の成立と匂坂氏",
      characterCount: 6534,
      illustrationCount: 6,
      sourceCount: 8,
      href: "/research/zosanji-sagisaka-history-source-criticism/",
    } as const;
    const zosanjiHeritagePublication = {
      title: "増参寺のソテツ・力石・六地蔵と境内景観",
      characterCount: 6062,
      illustrationCount: 6,
      sourceCount: 8,
      href: "/research/zosanji-sotetsu-chikaraishi-cultural-landscape/",
    } as const;
    const zosanjiCommunityPublication = {
      title: "増参寺・旧東光寺と大めし祭り",
      characterCount: 6002,
      illustrationCount: 6,
      sourceCount: 6,
      href: "/research/zosanji-daimeshi-tokoji-community-ritual/",
    } as const;
    const senkojiHeritagePublication = {
      title: "宣光寺の延命地蔵と毘沙門天",
      characterCount: 6094,
      illustrationCount: 6,
      sourceCount: 7,
      href: "/research/senkoji-jizo-bishamonten-object-biography/",
    } as const;
    const senkojiHistoryPublication = {
      title: "宣光寺梵鐘と徳川家康の遠江支配",
      characterCount: 6126,
      illustrationCount: 6,
      sourceCount: 7,
      href: "/research/senkoji-ieyasu-bell-inscription-territorial-rule/",
    } as const;
    const senkojiCommunityPublication = {
      title: "地蔵小路・和算額・見付学校と宣光寺",
      characterCount: 6239,
      illustrationCount: 6,
      sourceCount: 8,
      href: "/research/senkoji-jizo-lane-wasan-mitsuke-school-public-sphere/",
    } as const;
    const publication =
      temple.slug === "kokubunji-mitsuke"
        ? kokubunjiPublications[angle.key]
        : temple.slug === "ioji-kamada" && angle.key in iojiPublications
          ? iojiPublications[angle.key as keyof typeof iojiPublications]
          : temple.slug === "daijoin-nakaizumi" && angle.key === "history"
            ? daijoinHistoryPublication
          : temple.slug === "daijoin-nakaizumi" && angle.key === "heritage"
            ? daijoinHeritagePublication
          : temple.slug === "daijoin-nakaizumi" && angle.key === "community"
            ? daijoinCommunityPublication
          : temple.slug === "zosanji-sagisaka" && angle.key === "history"
            ? zosanjiHistoryPublication
          : temple.slug === "zosanji-sagisaka" && angle.key === "heritage"
            ? zosanjiHeritagePublication
          : temple.slug === "zosanji-sagisaka" && angle.key === "community"
            ? zosanjiCommunityPublication
          : temple.slug === "senkoji-mitsuke" && angle.key === "heritage"
            ? senkojiHeritagePublication
          : temple.slug === "senkoji-mitsuke" && angle.key === "history"
            ? senkojiHistoryPublication
          : temple.slug === "senkoji-mitsuke" && angle.key === "community"
            ? senkojiCommunityPublication
          : undefined;

    return {
      id: `${temple.slug}-${angle.key}`,
      kind: "temple" as const,
      title: publication?.title || `${temple.name}研究――${angle.label}`,
      templeName: temple.name,
      district: getDistrictName(temple.district_id),
      angle: angle.label,
      status: publication ? "published" as const : "planned" as const,
      characterCount: publication?.characterCount || 0,
      illustrationCount: publication?.illustrationCount || 0,
      sourceCount: publication
        ? publication.sourceCount
        : Array.isArray(temple.sources) ? temple.sources.length : 0,
      href: publication?.href,
      updatedAt: publication ? "2026-07-24" : undefined,
    };
  }),
);

export const allEditorialProgressItems = [...pillarProgressItems, ...templeProgressItems];

export const editorialProgressMeta = {
  updatedAt: "2026-07-24",
  targetCharacterCount: 6000,
  targetIllustrations: 3,
  targetHeadingMax: 6,
  pillarCount: pillarProgressItems.length,
  templeCount: existingTemples.length,
  templeArticleCount: templeProgressItems.length,
  totalCount: allEditorialProgressItems.length,
};
