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

export const activeResearchTemples = [
  { slug: "shokoji-shirabyoshi", name: "正光寺", stage: "調査・執筆" },
  { slug: "hounji-mukasa", name: "法雲寺", stage: "調査・執筆" },
  { slug: "anzenji-iwai", name: "安全寺", stage: "調査・執筆" },
] as const;
const activeResearchTempleSlugs = new Set<string>(activeResearchTemples.map((temple) => temple.slug));

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
    const shinpoinHistoryPublication = {
      title: "新豊院の開創伝承と向笠氏・可睡斎",
      characterCount: 6149,
      illustrationCount: 6,
      sourceCount: 8,
      href: "/research/shinpoin-mukasa-foundation-kasuisai-temple-network/",
    } as const;
    const shinpoinHeritagePublication = {
      title: "新豊院山古墳群と三角縁神獣鏡",
      characterCount: 6136,
      illustrationCount: 6,
      sourceCount: 9,
      href: "/research/shinpoinyama-kofun-mirror-transition-landscape/",
    } as const;
    const shinpoinCommunityPublication = {
      title: "新豊院の虚空蔵・八幡・観音札所",
      characterCount: 6017,
      illustrationCount: 6,
      sourceCount: 9,
      href: "/research/shinpoin-kokuzo-hachiman-pilgrimage-mukasa-landscape/",
    } as const;
    const kenshojiHistoryPublication = {
      title: "見性寺遺跡と見付の水陸交通史",
      characterCount: 6080,
      illustrationCount: 6,
      sourceCount: 9,
      href: "/research/kenshoji-site-lagoon-water-land-transport/",
    } as const;
    const kenshojiHeritagePublication = {
      title: "見性寺の移動文化財と3件の寺宝",
      characterCount: 6000,
      illustrationCount: 6,
      sourceCount: 7,
      href: "/research/kenshoji-mobile-heritage-fudo-arhats-gokorei/",
    } as const;
    const kenshojiCommunityPublication = {
      title: "見性寺に集積する処刑・俳諧・観音巡礼の記憶",
      characterCount: 6001,
      illustrationCount: 6,
      sourceCount: 8,
      href: "/research/kenshoji-nihonzaemon-haiku-kannon-memory/",
    } as const;
    const jushoujiHistoryPublication = {
      title: "蛭池寿正寺の成立年代と松秀寺門流",
      characterCount: 6236,
      illustrationCount: 6,
      sourceCount: 8,
      href: "/research/jushouji-hiruike-foundation-matsuhideji-lineage/",
    } as const;
    const jushoujiHeritagePublication = {
      title: "寿正寺の薬師堂移転と震災再建",
      characterCount: 6045,
      illustrationCount: 6,
      sourceCount: 8,
      href: "/research/jushouji-yakushido-earthquake-reconstruction-landscape/",
    } as const;
    const jushoujiCommunityPublication = {
      title: "蛭池寿正寺の寺領4石・末寺網・薬師巡礼",
      characterCount: 6088,
      illustrationCount: 6,
      sourceCount: 9,
      href: "/research/jushouji-four-koku-branch-temples-yakushi-pilgrimage/",
    } as const;
    const zendojiHistoryPublication = {
      title: "善導寺の応安開創伝承と念仏法脈",
      characterCount: 6241,
      illustrationCount: 6,
      sourceCount: 9,
      href: "/research/zendoji-oan-foundation-zendo-honen-lineage/",
    } as const;
    const zendojiHeritagePublication = {
      title: "善導寺の大樟と1967年移転",
      characterCount: 6526,
      illustrationCount: 6,
      sourceCount: 8,
      href: "/research/zendoji-camphor-tree-relocation-station-urban-heritage/",
    } as const;
    const zendojiCommunityPublication = {
      title: "善導寺の大涅槃絵軸と念仏儀礼",
      characterCount: 6270,
      illustrationCount: 6,
      sourceCount: 9,
      href: "/research/zendoji-nehan-scroll-annual-rites-chant-community/",
    } as const;
    const tokuoinHistoryPublication = {
      title: "徳翁院の創建と良純法親王・呑誉禿翁",
      characterCount: 6059,
      illustrationCount: 6,
      sourceCount: 8,
      href: "/research/tokuoin-foundation-ryojun-donyo-source-criticism/",
    } as const;
    const tokuoinHeritagePublication = {
      title: "徳翁院の十一面観音と念持仏伝承",
      characterCount: 6028,
      illustrationCount: 6,
      sourceCount: 8,
      href: "/research/tokuoin-eleven-faced-kannon-nenjibutsu-biography/",
    } as const;
    const tokuoinCommunityPublication = {
      title: "徳翁院の観音堂・稲荷社と見付の祭礼景観",
      characterCount: 6016,
      illustrationCount: 6,
      sourceCount: 8,
      href: "/research/tokuoin-kannon-inari-mitsuke-ritual-landscape/",
    } as const;
    const keiganjiHistoryPublication = {
      title: "慶岩寺の1562年開創伝承と知恩院末寺制",
      characterCount: 6034,
      illustrationCount: 6,
      sourceCount: 9,
      href: "/research/keiganji-noko-1562-chionin-lineage/",
    } as const;
    const keiganjiHeritagePublication = {
      title: "慶岩寺北向地蔵の移動・倒壊・再建",
      characterCount: 6016,
      illustrationCount: 6,
      sourceCount: 12,
      href: "/research/keiganji-kitamuki-jizo-movement-reconstruction/",
    } as const;
    const keiganjiCommunityPublication = {
      title: "慶岩寺から読む見付宿の都市宗教空間",
      characterCount: 6057,
      illustrationCount: 6,
      sourceCount: 13,
      href: "/research/keiganji-mitsuke-shukuba-urban-religious-space/",
    } as const;
    const daikenjiHistoryPublication = {
      title: "大見寺と見付端城の重層景観",
      characterCount: 6010,
      illustrationCount: 6,
      sourceCount: 8,
      href: "/research/daikenji-mitsuke-hajijo-map-temple-landscape/",
    } as const;
    const daikenjiHeritagePublication = {
      title: "大見寺の良純法親王供養塔と徳翁院",
      characterCount: 6005,
      illustrationCount: 6,
      sourceCount: 6,
      href: "/research/daikenji-ryojun-prince-tokuoin-memorial-network/",
    } as const;
    const daikenjiCommunityPublication = {
      title: "大見寺と鳥人・浮田幸吉の記憶",
      characterCount: 6084,
      illustrationCount: 6,
      sourceCount: 6,
      href: "/research/daikenji-ukita-kokichi-flight-memory-evidence/",
    } as const;
    const mantokujiHistoryPublication = {
      title: "満徳寺「中泉富士」の建築史",
      characterCount: 6101,
      illustrationCount: 6,
      sourceCount: 8,
      href: "/research/mantokuji-nakaizumi-fuji-architecture-carving/",
    } as const;
    const mantokujiHeritagePublication = {
      title: "満徳寺経蔵の黄檗版一切経と81面天井画",
      characterCount: 6019,
      illustrationCount: 6,
      sourceCount: 11,
      href: "/research/mantokuji-obaku-canon-ceiling-paintings/",
    } as const;
    const mantokujiCommunityPublication = {
      title: "満徳寺と中泉代官林鶴梁の家族墓",
      characterCount: 6001,
      illustrationCount: 6,
      sourceCount: 11,
      href: "/research/mantokuji-hayashi-kakuryo-grave-disaster-relief/",
    } as const;
    const saiganjiHistoryPublication = {
      title: "弘誓山西願寺と陣屋町中泉の真宗史",
      characterCount: 6168,
      illustrationCount: 6,
      sourceCount: 13,
      href: "/research/saiganji-shinshu-nakaizumi-urban-temple-history/",
    } as const;
    const saiganjiHeritagePublication = {
      title: "西願寺山門と旧中泉御殿裏門の建築史",
      characterCount: 6110,
      illustrationCount: 6,
      sourceCount: 8,
      href: "/research/saiganji-nakaizumi-goten-back-gate-architecture/",
    } as const;
    const saiganjiCommunityPublication = {
      title: "西願寺と中泉御殿の分散する記憶景観",
      characterCount: 6220,
      illustrationCount: 6,
      sourceCount: 12,
      href: "/research/saiganji-nakaizumi-goten-relocation-memory-landscape/",
    } as const;
    const gyosenjiHistoryPublication = {
      title: "行泉寺の1573年開創伝承と高田派教線",
      characterCount: 6138,
      illustrationCount: 6,
      sourceCount: 10,
      href: "/research/gyosenji-1573-ryuzan-takada-network/",
    } as const;
    const gyosenjiHeritagePublication = {
      title: "行泉寺の「中泉字南裏」と見付3080番地",
      characterCount: 6043,
      illustrationCount: 6,
      sourceCount: 10,
      href: "/research/gyosenji-nakaizumi-mitsuke-historical-geography/",
    } as const;
    const gyosenjiCommunityPublication = {
      title: "行泉寺の境内513坪・檀徒30戸を読む",
      characterCount: 6027,
      illustrationCount: 6,
      sourceCount: 10,
      href: "/research/gyosenji-1921-precinct-danto-continuity/",
    } as const;
    const kindaijiHistoryPublication = {
      title: "金台寺の成立記録と時宗寺院網",
      characterCount: 6032,
      illustrationCount: 6,
      sourceCount: 7,
      href: "/research/kindaiji-1472-jishu-shokoji-institutional-history/",
    } as const;
    const kindaijiHeritagePublication = {
      title: "金台寺の阿弥陀本尊と薬師霊場",
      characterCount: 6023,
      illustrationCount: 6,
      sourceCount: 7,
      href: "/research/kindaiji-amida-yakushi-pilgrimage-dual-devotion/",
    } as const;
    const kindaijiCommunityPublication = {
      title: "蛭子森の金台寺と渡河・冥界の宗教景観",
      characterCount: 6046,
      illustrationCount: 6,
      sourceCount: 8,
      href: "/research/kindaiji-ebisumori-ferry-enma-religious-landscape/",
    } as const;
    const shokojiHistoryPublication = {
      title: "省光寺の時宗改宗と足利氏外護伝承",
      characterCount: 6209,
      illustrationCount: 6,
      sourceCount: 6,
      href: "/research/shokoji-mitsuke-jishu-conversion-ashikaga-gosho-dojo/",
    } as const;
    const shokojiHeritagePublication = {
      title: "省光寺の阿弥陀三尊・イチョウ・近代公共圏",
      characterCount: 6067,
      illustrationCount: 6,
      sourceCount: 7,
      href: "/research/shokoji-mitsuke-amida-ginkgo-earthquake-school-landscape/",
    } as const;
    const shokojiCommunityPublication = {
      title: "省光寺出身・第51代遊行上人賦存の廻国",
      characterCount: 6045,
      illustrationCount: 6,
      sourceCount: 5,
      href: "/research/shokoji-mitsuke-yugyo-shonin-fuzon-jishu-network/",
    } as const;
    const saikojiHistoryPublication = {
      title: "西光寺の一遍来訪伝承と中世時宗文化",
      characterCount: 6521,
      illustrationCount: 6,
      sourceCount: 9,
      href: "/research/saikoji-mitsuke-ippen-jishu-medieval-heritage/",
    } as const;
    const saikojiHeritagePublication = {
      title: "西光寺に集積した徳川権威の記憶",
      characterCount: 6215,
      illustrationCount: 6,
      sourceCount: 10,
      href: "/research/saikoji-mitsuke-tokugawa-memory-gate-higiri-jizo/",
    } as const;
    const saikojiCommunityPublication = {
      title: "西光寺と見付宿の文化的景観",
      characterCount: 6147,
      illustrationCount: 6,
      sourceCount: 10,
      href: "/research/saikoji-mitsuke-shukuba-heritage-cultural-landscape/",
    } as const;
    const tamonjiHistoryPublication = {
      title: "多聞寺の1553年開山記録と見性寺末寺網",
      characterCount: 6026,
      illustrationCount: 6,
      sourceCount: 7,
      href: "/research/tamonji-1553-mokuso-kenshoji-temple-network/",
    } as const;
    const tamonjiHeritagePublication = {
      title: "多聞寺の毘沙門天と作者伝承",
      characterCount: 6112,
      illustrationCount: 6,
      sourceCount: 7,
      href: "/research/tamonji-bishamonten-tamonten-taishi-attribution/",
    } as const;
    const tamonjiCommunityPublication = {
      title: "多聞寺の寺領1石余と中野村",
      characterCount: 6040,
      illustrationCount: 6,
      sourceCount: 9,
      href: "/research/tamonji-ina-tadatsugu-temple-land-nakano-village/",
    } as const;
    const chusenjiHistoryPublication = {
      title: "中泉寺創建伝承と徳川家康・中泉御殿",
      characterCount: 6141,
      illustrationCount: 6,
      sourceCount: 8,
      href: "/research/chusenji-foundation-ieyasu-nakaizumi-goten-chronology/",
    } as const;
    const chusenjiHeritagePublication = {
      title: "中泉寺の中泉代官墓と幕府行政の記憶",
      characterCount: 6168,
      illustrationCount: 6,
      sourceCount: 7,
      href: "/research/chusenji-nakaizumi-magistrates-hiraoka-okazaki-memorial/",
    } as const;
    const chusenjiCommunityPublication = {
      title: "中泉寺の虚空蔵・子安地蔵・観音・坐禅",
      characterCount: 6137,
      illustrationCount: 6,
      sourceCount: 6,
      href: "/research/chusenji-kokuzo-koyasu-jizo-kannon-zazen-practice/",
    } as const;
    const senzojiHistoryPublication = {
      title: "泉蔵寺の1504年開創伝承と黙宗",
      characterCount: 6061,
      illustrationCount: 6,
      sourceCount: 7,
      href: "/research/senzoji-nakaizumi-1504-mokuso-myoshinji-lineage/",
    } as const;
    const senzojiHeritagePublication = {
      title: "泉蔵寺の寅薬師と複合信仰",
      characterCount: 6179,
      illustrationCount: 6,
      sourceCount: 10,
      href: "/research/senzoji-tora-yakushi-reijo-multi-deity-worship/",
    } as const;
    const senzojiCommunityPublication = {
      title: "泉蔵寺の秋鹿氏五輪塔群と中泉代官支配",
      characterCount: 6036,
      illustrationCount: 6,
      sourceCount: 10,
      href: "/research/senzoji-aika-daikan-gorinto-nakaizumi-governance/",
    } as const;
    const renpukujiHistoryPublication = {
      title: "連福寺の開創伝承と平重盛の3連寺",
      characterCount: 6627,
      illustrationCount: 6,
      sourceCount: 6,
      href: "/research/renpukuji-kobo-shigemori-sanrenji-origin-traditions/",
    } as const;
    const renpukujiHeritagePublication = {
      title: "連福寺の木造閻魔大王坐像と移動の履歴",
      characterCount: 6051,
      illustrationCount: 6,
      sourceCount: 6,
      href: "/research/renpukuji-enma-statue-object-biography/",
    } as const;
    const renpukujiCommunityPublication = {
      title: "連福寺古墳と三角縁神獣鏡",
      characterCount: 6079,
      illustrationCount: 6,
      sourceCount: 6,
      href: "/research/renpukuji-kofun-triangular-rim-mirror-ninomiya/",
    } as const;
    const jionjiHistoryPublication = {
      title: "慈恩寺所蔵1419年銘雲板の物質史",
      characterCount: 6064,
      illustrationCount: 6,
      sourceCount: 7,
      href: "/research/jionji-unpan-1419-takisenji-kamisaigo-object-biography/",
    } as const;
    const jionjiHeritagePublication = {
      title: "慈恩寺の中興史と見付の寺子屋教育",
      characterCount: 6064,
      illustrationCount: 6,
      sourceCount: 5,
      href: "/research/jionji-revival-terakoya-mitsuke-education-history/",
    } as const;
    const jionjiCommunityPublication = {
      title: "慈恩寺の観音・薬師信仰と重層する巡礼網",
      characterCount: 6021,
      illustrationCount: 6,
      sourceCount: 5,
      href: "/research/jionji-kannon-yakushi-rurikoji-pilgrimage-networks/",
    } as const;
    const shinnyojiHistoryPublication = {
      title: "眞如寺の道休庵から妙心寺直末への制度化",
      characterCount: 6002,
      illustrationCount: 6,
      sourceCount: 8,
      href: "/research/shinnyoji-dokyuan-shinnyoan-myoshinji-jikimatsu/",
    } as const;
    const shinnyojiHeritagePublication = {
      title: "眞如寺と匂坂氏の内寺",
      characterCount: 6047,
      illustrationCount: 6,
      sourceCount: 6,
      href: "/research/shinnyoji-sagisaka-clan-naiji-takagi-domain/",
    } as const;
    const shinnyojiCommunityPublication = {
      title: "眞如寺の盤珪国師開山伝承",
      characterCount: 6042,
      illustrationCount: 6,
      sourceCount: 9,
      href: "/research/shinnyoji-bankei-kokushi-fusho-zen-kaizan-memory/",
    } as const;
    const jokojiHistoryPublication = {
      title: "定光寺の曹洞宗中興と朱印寺院化",
      characterCount: 6081,
      illustrationCount: 6,
      sourceCount: 6,
      href: "/research/jokoji-kasuisai-conversion-shuin-relocation/",
    } as const;
    const jokojiHeritagePublication = {
      title: "定光寺木造千手観音菩薩立像の物質的伝記",
      characterCount: 6076,
      illustrationCount: 6,
      sourceCount: 7,
      href: "/research/jokoji-senju-kannon-rengeji-restoration/",
    } as const;
    const jokojiCommunityPublication = {
      title: "前野村の定光寺と末寺・観音信仰ネットワーク",
      characterCount: 6004,
      illustrationCount: 6,
      sourceCount: 7,
      href: "/research/jokoji-maeno-village-subtemples-kannon-network/",
    } as const;
    const koganjiHistoryPublication = {
      title: "光嚴寺の1605年開創伝承と聖寿寺法系",
      characterCount: 6013,
      illustrationCount: 6,
      sourceCount: 9,
      href: "/research/koganji-giden-1605-seijuji-lineage/",
    } as const;
    const koganjiHeritagePublication = {
      title: "光嚴寺の医王薬師如来と草崎の現世救済",
      characterCount: 6010,
      illustrationCount: 6,
      sourceCount: 11,
      href: "/research/koganji-io-yakushi-local-healing-faith/",
    } as const;
    const koganjiCommunityPublication = {
      title: "光嚴寺と草崎の寺院集積・水辺景観",
      characterCount: 6034,
      illustrationCount: 6,
      sourceCount: 12,
      href: "/research/koganji-kusasaki-temple-cluster-water-landscape/",
    } as const;
    const jissaijiHistoryPublication = {
      title: "実際寺の天正創建伝承と曹洞宗本末制",
      characterCount: 6263,
      illustrationCount: 6,
      sourceCount: 13,
      href: "/research/jissaiji-tensho-sonshuku-jurinji-kasuisai-genealogy/",
    } as const;
    const jissaijiHeritagePublication = {
      title: "実際寺朱印寺領と鮫島の神明社・天神社",
      characterCount: 6173,
      illustrationCount: 6,
      sourceCount: 13,
      href: "/research/jissaiji-red-seal-estate-shinmei-tenjin-shinbutsu/",
    } as const;
    const jissaijiCommunityPublication = {
      title: "実際寺と鮫島村の水・新田・海岸景観",
      characterCount: 6091,
      illustrationCount: 6,
      sourceCount: 13,
      href: "/research/jissaiji-samejima-village-water-newfield-coastal-landscape/",
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
          : temple.slug === "shinpoin-mukasa" && angle.key === "history"
            ? shinpoinHistoryPublication
          : temple.slug === "shinpoin-mukasa" && angle.key === "heritage"
            ? shinpoinHeritagePublication
          : temple.slug === "shinpoin-mukasa" && angle.key === "community"
            ? shinpoinCommunityPublication
          : temple.slug === "kenshoji-mitsuke" && angle.key === "history"
            ? kenshojiHistoryPublication
          : temple.slug === "kenshoji-mitsuke" && angle.key === "heritage"
            ? kenshojiHeritagePublication
          : temple.slug === "kenshoji-mitsuke" && angle.key === "community"
            ? kenshojiCommunityPublication
          : temple.slug === "jushouji-hiruike" && angle.key === "history"
            ? jushoujiHistoryPublication
          : temple.slug === "jushouji-hiruike" && angle.key === "heritage"
            ? jushoujiHeritagePublication
          : temple.slug === "jushouji-hiruike" && angle.key === "community"
            ? jushoujiCommunityPublication
          : temple.slug === "zendoji-mitsuke" && angle.key === "history"
            ? zendojiHistoryPublication
          : temple.slug === "zendoji-mitsuke" && angle.key === "heritage"
            ? zendojiHeritagePublication
          : temple.slug === "zendoji-mitsuke" && angle.key === "community"
            ? zendojiCommunityPublication
          : temple.slug === "tokuoin-mitsuke" && angle.key === "history"
            ? tokuoinHistoryPublication
          : temple.slug === "tokuoin-mitsuke" && angle.key === "heritage"
            ? tokuoinHeritagePublication
          : temple.slug === "tokuoin-mitsuke" && angle.key === "community"
            ? tokuoinCommunityPublication
          : temple.slug === "keiganji-mitsuke" && angle.key === "history"
            ? keiganjiHistoryPublication
          : temple.slug === "keiganji-mitsuke" && angle.key === "heritage"
            ? keiganjiHeritagePublication
          : temple.slug === "keiganji-mitsuke" && angle.key === "community"
            ? keiganjiCommunityPublication
          : temple.slug === "daikenji-mitsuke" && angle.key === "history"
            ? daikenjiHistoryPublication
          : temple.slug === "daikenji-mitsuke" && angle.key === "heritage"
            ? daikenjiHeritagePublication
          : temple.slug === "daikenji-mitsuke" && angle.key === "community"
            ? daikenjiCommunityPublication
          : temple.slug === "mantokuji-nakaizumi" && angle.key === "history"
            ? mantokujiHistoryPublication
          : temple.slug === "mantokuji-nakaizumi" && angle.key === "heritage"
            ? mantokujiHeritagePublication
          : temple.slug === "mantokuji-nakaizumi" && angle.key === "community"
            ? mantokujiCommunityPublication
          : temple.slug === "saiganji-nakaizumi" && angle.key === "history"
            ? saiganjiHistoryPublication
          : temple.slug === "saiganji-nakaizumi" && angle.key === "heritage"
            ? saiganjiHeritagePublication
          : temple.slug === "saiganji-nakaizumi" && angle.key === "community"
            ? saiganjiCommunityPublication
          : temple.slug === "gyosenji-mitsuke" && angle.key === "history"
            ? gyosenjiHistoryPublication
          : temple.slug === "gyosenji-mitsuke" && angle.key === "heritage"
            ? gyosenjiHeritagePublication
          : temple.slug === "gyosenji-mitsuke" && angle.key === "community"
            ? gyosenjiCommunityPublication
          : temple.slug === "kindaiji-tenryu" && angle.key === "history"
            ? kindaijiHistoryPublication
          : temple.slug === "kindaiji-tenryu" && angle.key === "heritage"
            ? kindaijiHeritagePublication
          : temple.slug === "kindaiji-tenryu" && angle.key === "community"
            ? kindaijiCommunityPublication
          : temple.slug === "shokoji-mitsuke" && angle.key === "history"
            ? shokojiHistoryPublication
          : temple.slug === "shokoji-mitsuke" && angle.key === "heritage"
            ? shokojiHeritagePublication
          : temple.slug === "shokoji-mitsuke" && angle.key === "community"
            ? shokojiCommunityPublication
          : temple.slug === "saikoji-mitsuke" && angle.key === "history"
            ? saikojiHistoryPublication
          : temple.slug === "saikoji-mitsuke" && angle.key === "heritage"
            ? saikojiHeritagePublication
          : temple.slug === "saikoji-mitsuke" && angle.key === "community"
            ? saikojiCommunityPublication
          : temple.slug === "tamonji-nakano" && angle.key === "history"
            ? tamonjiHistoryPublication
          : temple.slug === "tamonji-nakano" && angle.key === "heritage"
            ? tamonjiHeritagePublication
          : temple.slug === "tamonji-nakano" && angle.key === "community"
            ? tamonjiCommunityPublication
          : temple.slug === "chusenji-nakaizumi" && angle.key === "history"
            ? chusenjiHistoryPublication
          : temple.slug === "chusenji-nakaizumi" && angle.key === "heritage"
            ? chusenjiHeritagePublication
          : temple.slug === "chusenji-nakaizumi" && angle.key === "community"
            ? chusenjiCommunityPublication
          : temple.slug === "senzoji-nakaizumi" && angle.key === "history"
            ? senzojiHistoryPublication
          : temple.slug === "senzoji-nakaizumi" && angle.key === "heritage"
            ? senzojiHeritagePublication
          : temple.slug === "senzoji-nakaizumi" && angle.key === "community"
            ? senzojiCommunityPublication
          : temple.slug === "renpukuji-ninomiya" && angle.key === "history"
            ? renpukujiHistoryPublication
          : temple.slug === "renpukuji-ninomiya" && angle.key === "heritage"
            ? renpukujiHeritagePublication
          : temple.slug === "renpukuji-ninomiya" && angle.key === "community"
            ? renpukujiCommunityPublication
          : temple.slug === "jionji-mitsuke" && angle.key === "history"
            ? jionjiHistoryPublication
          : temple.slug === "jionji-mitsuke" && angle.key === "heritage"
            ? jionjiHeritagePublication
          : temple.slug === "jionji-mitsuke" && angle.key === "community"
            ? jionjiCommunityPublication
          : temple.slug === "shinnyoji-sagisaka" && angle.key === "history"
            ? shinnyojiHistoryPublication
          : temple.slug === "shinnyoji-sagisaka" && angle.key === "heritage"
            ? shinnyojiHeritagePublication
          : temple.slug === "shinnyoji-sagisaka" && angle.key === "community"
            ? shinnyojiCommunityPublication
          : temple.slug === "jokoji-maeno" && angle.key === "history"
            ? jokojiHistoryPublication
          : temple.slug === "jokoji-maeno" && angle.key === "heritage"
            ? jokojiHeritagePublication
          : temple.slug === "jokoji-maeno" && angle.key === "community"
            ? jokojiCommunityPublication
          : temple.slug === "koganji-kusasaki" && angle.key === "history"
            ? koganjiHistoryPublication
          : temple.slug === "koganji-kusasaki" && angle.key === "heritage"
            ? koganjiHeritagePublication
          : temple.slug === "koganji-kusasaki" && angle.key === "community"
            ? koganjiCommunityPublication
          : temple.slug === "jissaiji-samejima" && angle.key === "history"
            ? jissaijiHistoryPublication
          : temple.slug === "jissaiji-samejima" && angle.key === "heritage"
            ? jissaijiHeritagePublication
          : temple.slug === "jissaiji-samejima" && angle.key === "community"
            ? jissaijiCommunityPublication
          : undefined;

    return {
      id: `${temple.slug}-${angle.key}`,
      kind: "temple" as const,
      title: publication?.title || `${temple.name}研究――${angle.label}`,
      templeName: temple.name,
      district: getDistrictName(temple.district_id),
      angle: angle.label,
      status: publication
        ? "published" as const
        : activeResearchTempleSlugs.has(temple.slug)
          ? "researching" as const
          : "planned" as const,
      characterCount: publication?.characterCount || 0,
      illustrationCount: publication?.illustrationCount || 0,
      sourceCount: publication
        ? publication.sourceCount
        : Array.isArray(temple.sources) ? temple.sources.length : 0,
      href: publication?.href,
      updatedAt: publication || activeResearchTempleSlugs.has(temple.slug) ? "2026-07-24" : undefined,
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
