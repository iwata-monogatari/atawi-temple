import {
  buildPriorityLongformV2,
  priorityPortalOverrides,
  type PriorityLongform,
} from "./portal-priority-articles";

export type PortalCategoryKey =
  | "houyou"
  | "bodaiji"
  | "ohaka"
  | "butsudan"
  | "kisei"
  | "jikka"
  | "kazoku-kaigi"
  | "akiya"
  | "jikka-karute";

export type PortalArticle = {
  slug: string;
  category: PortalCategoryKey;
  categoryLabel: string;
  title: string;
  description: string;
  lead: string;
  conclusion: string;
  firstAction: string;
  steps: { title: string; body: string }[];
  conversationExample: string;
  caution: string;
  points: string[];
  faq: { question: string; answer: string }[];
  sources: { label: string; href: string; note: string }[];
  previous?: { href: string; label: string };
  next?: { href: string; label: string };
  cta: "weak" | "medium" | "strong";
  updated: string;
  longform?: PriorityLongform;
  contentType: "guide";
  journeyStage: 1 | 2 | 3 | 4 | 5 | 6;
  journeyType: "bodaiji" | "houyou" | "haka" | "butsudan" | "family" | "jikka";
};

const journeyByCategory: Record<PortalCategoryKey, Pick<PortalArticle, "journeyStage" | "journeyType">> = {
  bodaiji: { journeyStage: 1, journeyType: "bodaiji" },
  houyou: { journeyStage: 2, journeyType: "houyou" },
  kisei: { journeyStage: 2, journeyType: "houyou" },
  ohaka: { journeyStage: 3, journeyType: "haka" },
  butsudan: { journeyStage: 4, journeyType: "butsudan" },
  "kazoku-kaigi": { journeyStage: 5, journeyType: "family" },
  jikka: { journeyStage: 6, journeyType: "jikka" },
  akiya: { journeyStage: 6, journeyType: "jikka" },
  "jikka-karute": { journeyStage: 6, journeyType: "jikka" },
};

const sourceSets: Record<PortalCategoryKey, PortalArticle["sources"]> = {
  houyou: [
    { label: "全日本仏教会「仏教について」", href: "https://www.jbf.ne.jp/interest/", note: "仏教行事を考える際の基礎情報" },
    { label: "ATAWI TEMPLE 編集方針", href: "/editorial-policy/", note: "宗派・地域差を断定しないための掲載基準" },
  ],
  bodaiji: [
    { label: "文化庁「宗教法人と宗務行政」", href: "https://www.bunka.go.jp/seisaku/shukyohojin/", note: "宗教法人制度の公的な基礎情報" },
    { label: "全日本仏教会「加盟団体」", href: "https://www.jbf.ne.jp/about/organization/", note: "宗派・仏教団体の公式情報を探す手がかり" },
  ],
  ohaka: [
    { label: "厚生労働省「墓地、埋葬等に関する法律」", href: "https://www.mhlw.go.jp/web/t_doc?dataId=80156000", note: "埋葬・改葬制度の一次情報" },
    { label: "磐田市公式サイト", href: "https://www.city.iwata.shizuoka.jp/", note: "市営墓地や改葬など地域の手続きは市へ確認" },
  ],
  butsudan: [
    { label: "全日本仏教会「仏教について」", href: "https://www.jbf.ne.jp/interest/", note: "仏教文化についての基礎情報" },
    { label: "ATAWI TEMPLE 寺院検索", href: "/search/", note: "菩提寺・相談先を確認するための寺院データベース" },
  ],
  kisei: [
    { label: "気象庁「防災情報」", href: "https://www.jma.go.jp/bosai/", note: "帰省前の気象・防災確認" },
    { label: "国土交通省「道路情報」", href: "https://www.mlit.go.jp/road/traffic/", note: "自動車移動前の公的な道路情報" },
  ],
  jikka: [
    { label: "国土交通省「住まいの維持管理」", href: "https://www.mlit.go.jp/jutakukentiku/house/", note: "住宅を安全に維持するための公的情報" },
    { label: "磐田市公式サイト", href: "https://www.city.iwata.shizuoka.jp/", note: "防災・ごみ・住まいに関する地域情報" },
  ],
  "kazoku-kaigi": [
    { label: "法務省「相続登記の申請義務化」", href: "https://www.moj.go.jp/MINJI/minji05_00435.html", note: "権利関係を話す際に確認したい公的情報" },
    { label: "政府広報オンライン「相続登記」", href: "https://www.gov-online.go.jp/useful/article/202203/2.html", note: "家族で制度の概要を共有するための資料" },
  ],
  akiya: [
    { label: "国土交通省「空き家対策」", href: "https://www.mlit.go.jp/jutakukentiku/house/jutakukentiku_house_tk3_000035.html", note: "空き家対策の制度・資料" },
    { label: "磐田市公式サイト", href: "https://www.city.iwata.shizuoka.jp/", note: "磐田市の空き家相談・地域制度の確認先" },
  ],
  "jikka-karute": [
    { label: "法務局「登記手続案内」", href: "https://houmukyoku.moj.go.jp/homu/static/goannai_index_fudousan.html", note: "土地・建物の登記情報に関する公的案内" },
    { label: "国税庁「相続税」", href: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/sozoku/souzo.htm", note: "税に関する判断をせず、公式情報へ確認するための入口" },
    { label: "ATAWI TEMPLE 編集方針", href: "/editorial-policy/", note: "実家情報を扱う際の編集・表現方針" },
  ],
};

function makeSpecificGuidance(title: string, category: PortalCategoryKey, index: number) {
  const subject = title.replace(/[？?].*$/, "").replace(/するとき.*$/, "").replace(/について.*$/, "");
  const keywordGuides: { test: RegExp; action: string; caution: string }[] = [
    { test: /日程|予定|時期|日/, action: "候補日を二つ以上書き出し、菩提寺・会場・参加する家族の順で都合を確認します。", caution: "年忌の営み方や時期には地域・寺院ごとの考え方があります。暦だけで決めず、菩提寺へ確認してください。" },
    { test: /菩提寺|寺院|宗派|檀家/, action: "寺院名、所在地、墓地や位牌に残る表記を別々にメモし、推測と確認済みの情報を分けます。", caution: "建物や仏具の見た目だけで宗派を断定しないでください。寺院の公式案内または寺院への問い合わせを優先します。" },
    { test: /墓|納骨|改葬|永代供養|合祀|樹木葬/, action: "墓地名、区画、使用者、管理者、納骨されている方を一枚のメモに整理します。", caution: "改葬や納骨には管理者・自治体への確認が必要になる場合があります。契約や手続きを自己判断で進めないでください。" },
    { test: /仏壇|位牌|過去帳|遺影|仏具/, action: "動かす前に全体写真と文字が読める写真を撮り、誰に関するものか家族へ確認します。", caution: "位牌や過去帳は家族の大切な記録です。本人や家族の同意なく処分・移動・公開をしないでください。" },
    { test: /車|新幹線|移動|帰省|宿泊/, action: "法要の開始時刻から逆算し、移動、休憩、実家へ立ち寄る時間を分けて予定表にします。", caution: "天候や交通事情により予定は変わります。高齢者や子どもが同行する場合は余白を多めに取ってください。" },
    { test: /屋根|雨どい|外壁|庭木|雑草|塀|門扉|窓/, action: "危険な場所へ上がらず、道路や敷地内の安全な位置から日付入りの写真を残します。", caution: "屋根、脚立、高所、傷んだ塀には近づかず、異常がある場合は専門業者へ確認してください。" },
    { test: /水|ガス|電気|ブレーカー|火|冷蔵庫|浴室|トイレ/, action: "におい、音、濡れ、メーターの変化を目視できる範囲で確認し、異常の場所と時刻を記録します。", caution: "漏電、ガス臭、水漏れなど危険を感じたら操作を続けず、契約先や緊急窓口へ連絡してください。" },
    { test: /書類|通知書|権利|保険|通帳|印鑑|税/, action: "書類名、発行元、記載年、保管場所だけを記録し、原本は本人の許可なく移動しません。", caution: "個人情報や財産情報を撮影・共有するときは本人の同意を得て、送信先と保管方法を限定してください。" },
    { test: /家族会議|話|相談|希望|意見/, action: "最初に本人の希望を聞き、確認済みの事実、家族の意見、未確認事項の三列に分けてメモします。", caution: "その場で売る・残すを決める必要はありません。感情的になった場合は結論を出さず、次回の日だけ決めます。" },
    { test: /空き家|留守|管理|見守/, action: "鍵、郵便、庭木、通水、緊急連絡先について、担当者と次の確認日を一つずつ決めます。", caution: "管理頻度や必要な対応は建物の状態で異なります。危険や近隣への影響がある場合は自治体・専門家へ相談してください。" },
    { test: /写真|記録|カルテ|一覧|共有/, action: "確認日、確認した人、場所、分かったこと、未確認事項を同じ形式で記録します。", caution: "記録には個人情報が含まれます。家族内でも共有範囲を決め、公開リンクやSNSには載せないでください。" },
  ];
  const matched = keywordGuides.find((guide) => guide.test.test(title)) || {
    action: `「${subject}」について、分かっていることと確認が必要なことを二列に分けて書き出します。`,
    caution: "地域、寺院、契約、家族の事情によって答えは変わります。分からないことを推測で埋めず、確認先を記録してください。",
  };
  return {
    firstAction: matched.action,
    steps: [
      { title: "いま分かる事実を集める", body: `${subject}に関係する写真、書類、家族の記憶を集めます。確認できた日と情報の出どころも一緒に残します。` },
      { title: "未確認の項目を一つ選ぶ", body: `全部を一度に終わらせず、「${subject}」について次に確かめる項目を一つだけ選び、確認する相手を決めます。` },
      { title: "家族へ同じ形で共有する", body: `確認結果を「確認済み・未確認・次にすること」に分けます。記事番号${index + 1}の記録として日付を添えると、次回の帰省でも続けられます。` },
    ],
    conversationExample: `「${subject}について、今日は結論を決めたいのではなく、今分かっていることだけ一緒に確認してもいい？」`,
    caution: matched.caution,
  };
}

type CategoryDefinition = {
  label: string;
  count: number;
  position: number;
  intro: string;
  conclusion: string;
  points: string[];
  topics: string[];
};

const categoryOrder: PortalCategoryKey[] = [
  "houyou",
  "bodaiji",
  "ohaka",
  "butsudan",
  "kisei",
  "jikka",
  "kazoku-kaigi",
  "akiya",
  "jikka-karute",
];

const definitions: Record<PortalCategoryKey, CategoryDefinition> = {
  houyou: {
    label: "法要準備",
    count: 30,
    position: 1,
    intro: "法要の準備は、分からないことを一つずつ確かめるところから始まります。故人とのつながりや地域の習慣を大切にしながら、無理のない順序で整えましょう。",
    conclusion: "まず菩提寺やご家族が把握している事実を確認し、決まっていないことは決まっていないまま共有して構いません。",
    points: ["菩提寺や会場へ早めに確認する", "家族内の役割を一人に集中させない", "地域・寺院による違いを前提にする", "日時と連絡先を紙でも残す"],
    topics: [
      "法要準備は何から始める？最初の確認順序", "法要の日程を決めるときの家族との相談", "年忌法要の数え方を確認する方法",
      "四十九日法要の準備で確認したいこと", "一周忌法要までに家族で決めること", "三回忌法要を小さく営むときの考え方",
      "法要会場を自宅・寺院・会館から選ぶ", "法要に招く範囲を家族で相談する", "法要案内状に書く内容と送り方",
      "法要を家族だけで行う場合の伝え方", "遠方の親族へ法要予定を知らせる時期", "法要当日の持ち物を前日までにそろえる",
      "法要当日の流れを家族で共有する", "施主・喪主の役割を確認する", "法要の受付をお願いするときの準備",
      "法要後の会食を行うか迷ったとき", "お斎の会場と人数を決める手順", "法要の返礼品を準備するときの考え方",
      "お布施について寺院へ確認するときの聞き方", "御車料・御膳料を確認するときの注意", "法要の服装を親族間でそろえる方法",
      "子どもと一緒に法要へ参列するとき", "高齢の家族が参列する法要の準備", "車いす利用者がいる法要での会場確認",
      "雨の日の法要と墓参りに備える", "夏の法要で暑さに備える", "冬の法要で移動と寒さに備える",
      "オンライン参加を取り入れるときの準備", "法要を延期・変更するときの連絡順序", "法要後に記録しておきたいこと",
    ],
  },
  bodaiji: {
    label: "菩提寺・宗派",
    count: 20,
    position: 2,
    intro: "菩提寺や宗派については、家族の記憶だけで判断せず、位牌・過去帳・墓地の表示・寺院の案内など複数の手がかりを照らし合わせます。",
    conclusion: "宗派名や関係寺院を推測で決めず、分かる資料を手元に置いて寺院へ確認することが安心につながります。",
    points: ["寺院名と所在地を記録する", "位牌・過去帳・墓石の情報を照合する", "宗派は断定せず公式情報を優先する", "家族が知っている経緯を書き留める"],
    topics: [
      "菩提寺とは何かを家族で確認する", "菩提寺が分からないときの調べ方", "実家の菩提寺を親に聞くときの質問",
      "寺院名は分かるが所在地が不明なとき", "墓地から菩提寺を確認する手がかり", "過去帳から寺院との関係をたどる",
      "位牌の記録から確認できること", "親族が別々の菩提寺を持つ場合の整理", "菩提寺が遠方にあるときの法要相談",
      "引っ越し後も菩提寺との関係を続けるには", "菩提寺へ初めて連絡するときの伝え方", "長く連絡していない菩提寺へ相談する",
      "宗派が分からないときに見直す資料", "同じ宗派でも作法が異なる理由", "焼香の回数を断定せず確認する方法",
      "読経や法要の流れを寺院へ尋ねる", "宗派名の表記が資料ごとに違うとき", "寺院の公式情報と家族の記憶が違うとき",
      "檀家かどうか分からない場合の確認", "菩提寺について家族の記録を残す",
    ],
  },
  ohaka: {
    label: "墓・納骨・永代供養",
    count: 25,
    position: 3,
    intro: "お墓や納骨について考えるときは、墓地の管理者、使用者、家族の希望を分けて確認します。供養の形を急いで一つに決める必要はありません。",
    conclusion: "現地の状態と契約・管理の情報を確かめ、家族と寺院・管理者の双方に相談できる材料を整えましょう。",
    points: ["墓地名・区画・管理者を確認する", "墓石や周囲の写真を残す", "納骨済みの方を家族で照合する", "費用や手続きは管理者へ個別に確認する"],
    topics: [
      "実家のお墓の場所を家族で共有する", "墓地の管理者が分からないとき", "墓地使用者の名義を確認する方法",
      "墓参りで墓石の状態を確認する", "墓石の文字を記録するときの注意", "墓地の年間管理について確認する",
      "遠方のお墓を家族で見守る方法", "お墓の掃除を無理なく続けるには", "墓参りの持ち物を準備する",
      "納骨の日程を寺院と相談する", "納骨前に家族で確認すること", "納骨済みの記録を整理する",
      "納骨先が複数ある家族の情報整理", "墓じまいを決める前に確認すること", "改葬について家族で話し始める",
      "改葬手続きの相談先を整理する", "永代供養とは何かを確認する", "永代供養を検討するときの質問",
      "合祀について事前に確認したいこと", "納骨堂を検討するときの確認項目", "樹木葬を検討するときの確認項目",
      "寺院墓地と公営・民営墓地の確認", "承継する人が未定のお墓について話す", "お墓の写真と書類を一緒に保管する",
      "お墓の今後を家族会議の議題にする",
    ],
  },
  butsudan: {
    label: "仏壇・位牌・過去帳",
    count: 20,
    position: 4,
    intro: "仏壇、位牌、過去帳には、家族が受け継いできた名前や命日の記録があります。移動や整理を考える前に、現状を丁寧に記録します。",
    conclusion: "扱い方は宗派や寺院、地域、家族の考えで異なります。処分や移動を急がず、まず記録と相談先を整えましょう。",
    points: ["全体と文字が読める写真を残す", "誰の位牌か家族に確認する", "過去帳の保管場所を共有する", "移動前に菩提寺へ相談する"],
    topics: [
      "実家の仏壇を帰省時に確認する", "仏壇の写真を記録として残す方法", "仏壇の引き出しで確認するもの",
      "位牌が何柱あるかを家族で確認する", "位牌の文字を安全に記録する", "位牌と過去帳の記載を照合する",
      "過去帳とは何かを家族で共有する", "過去帳の保管場所を決める", "過去帳を撮影するときに配慮すること",
      "遺影と位牌の人物を照合する", "仏壇を移動する前に相談すること", "実家の建て替えと仏壇の移動",
      "親が施設へ移るときの仏壇について", "空き家になる実家の仏壇を考える", "仏壇を守る人が決まっていないとき",
      "小さな仏壇へ移すことを相談する", "位牌をまとめる前に確認すること", "仏壇の手入れを家族で分担する",
      "仏具の名前が分からないときの記録", "仏壇・位牌・過去帳の一覧を作る",
    ],
  },
  kisei: {
    label: "法要帰省",
    count: 25,
    position: 5,
    intro: "法要や墓参りでの帰省は、寺院への参拝だけでなく、離れて暮らす家族が故郷の現状を知る機会でもあります。",
    conclusion: "予定を詰め込みすぎず、法要を第一にしながら、家族でしか確認できないことを一つ持ち帰れば十分です。",
    points: ["法要と移動の時間に余裕を持つ", "実家に立ち寄る時間を確保する", "親族への連絡を一本化する", "確認結果を家族へ共有する"],
    topics: [
      "法要帰省の予定を立てる順序", "日帰りの法要帰省で優先すること", "一泊の法要帰省でできる実家確認",
      "遠方から法要へ帰省するときの準備", "新幹線で法要帰省するときの持ち物", "車で法要帰省するときの安全確認",
      "子どもを連れて法要帰省するとき", "高齢の親と法要へ向かうとき", "きょうだいで帰省日が違う場合の共有",
      "法要前日に確認しておく連絡先", "法要当日の朝に慌てないための準備", "法要後に実家へ立ち寄る時間を作る",
      "墓参りと実家確認を同日に行う", "お盆の帰省で法要準備を確認する", "お彼岸の帰省で家族と話すこと",
      "年末年始の帰省で仏壇を確認する", "台風時期の法要帰省に備える", "猛暑日の墓参りと実家確認",
      "帰省できない家族へ写真で共有する", "法要帰省の交通費を家族で相談する", "宿泊先を実家以外にする選択",
      "親族宅へ立ち寄るときの連絡", "法要帰省で持ち帰る書類を決める", "帰省後に家族へ報告する内容",
      "次の帰省までにすることを一つ決める",
    ],
  },
  jikka: {
    label: "帰省時の実家確認",
    count: 30,
    position: 6,
    intro: "実家の確認は、売る・残すを決める作業ではありません。外から見える変化、暮らしの困りごと、書類の所在を家族で共有するための確認です。",
    conclusion: "一度ですべて調べず、気づいたことを写真と短いメモで残してください。結論は、家族が状況を共有してから考えられます。",
    points: ["許可なく私物を動かさない", "危険な場所へ無理に入らない", "写真には日付と場所を添える", "本人の希望を最初に聞く"],
    topics: [
      "帰省時の実家確認は外観から始める", "屋根や雨どいを地上から確認する", "外壁のひびや傷みを記録する",
      "庭木が道路へ出ていないか確認する", "雑草と落ち葉の状態を確認する", "門扉・塀・フェンスを確認する",
      "玄関の鍵と合鍵の所在を確認する", "郵便受けに郵便物がたまっていないか", "宅配物や不在票を確認する",
      "電気・水道・ガスの使用状況を確認する", "水漏れや異臭に気づいたとき", "ブレーカーと分電盤の場所を確認する",
      "台所の食品と火の元を確認する", "冷蔵庫を無理なく確認する", "浴室・洗面所の湿気を確認する",
      "トイレの水と換気を確認する", "窓・雨戸・網戸の状態を確認する", "室内の換気を安全に行う",
      "仏壇と位牌の状態を確認する", "重要書類の保管場所を本人に聞く", "固定資産税の通知書を確認する",
      "火災保険の書類を確認する", "土地・建物の権利証類を確認する", "通帳や印鑑を勝手に動かさないために",
      "近所との連絡状況を親に聞く", "自治会や地域の役割を確認する", "防災用品と避難経路を確認する",
      "親の暮らしに不便がないか聞く", "実家確認の写真を家族で共有する", "帰省時チェックリストを次回へ引き継ぐ",
    ],
  },
  "kazoku-kaigi": {
    label: "家族会議",
    count: 20,
    position: 7,
    intro: "実家についての家族会議は、結論を迫る場ではなく、本人の希望と家族が把握している事実を同じテーブルに置く場です。",
    conclusion: "決まらなかったことも記録し、次に話す時期を決めて終えれば、家族会議は前に進んでいます。",
    points: ["本人の希望から聞く", "事実と意見を分けて話す", "欠席者にも同じ情報を共有する", "決定事項と保留事項を記録する"],
    topics: [
      "実家の家族会議を始めるきっかけ", "親へ実家の話を切り出す言葉", "法要後に家族会議を開くときの配慮",
      "きょうだいで実家の現状を共有する", "家族会議の議題を三つに絞る", "本人の希望を最初に確認する",
      "実家を守りたい気持ちを尊重する", "売る・残すの二択にしない話し方", "家族の意見が分かれたときの整理",
      "遠方の家族がオンラインで参加する", "家族会議に親族を呼ぶ範囲", "家族会議の司会役を決める",
      "感情的になったときに会議を止める", "分からないことを宿題として残す", "家族会議のメモを全員へ送る",
      "実家の維持費を事実として共有する", "家の中の思い出の品について話す", "仏壇とお墓を別々の議題にする",
      "次の家族会議の日を決める", "家族だけで決めにくいときの相談先",
    ],
  },
  akiya: {
    label: "空き家予防",
    count: 20,
    position: 8,
    intro: "空き家予防は、家が空いてから始めるものではありません。暮らしているうちに連絡先、管理方法、書類の所在を共有しておくことが備えになります。",
    conclusion: "家をどうするかの結論より先に、変化に気づける人と連絡できる人を決めておくことが大切です。",
    points: ["緊急連絡先を家族で共有する", "定期的に外観を確認する", "郵便物と庭木の管理方法を決める", "契約・税・保険の書類を整理する"],
    topics: [
      "実家が空き家になる前に話すこと", "親の入院をきっかけに家の管理を確認する", "親が施設へ移る前の実家確認",
      "留守が長くなる実家の連絡体制", "空き家予防のための家族連絡網", "近所へ伝える内容を本人と相談する",
      "郵便物をためないための方法", "庭木と草刈りの管理を決める", "台風後に実家を確認する体制",
      "水道管の凍結や漏水に備える", "換気と通水の頻度を決める", "防犯のために外から確認すること",
      "火災保険の契約内容を確認する", "固定資産税の通知先を確認する", "実家の鍵を家族で管理する",
      "家財を急いで片づけないための記録", "空き家管理を家族で分担する", "遠方から実家を見守る方法",
      "管理が難しくなったときの相談準備", "空き家予防の確認表を更新する",
    ],
  },
  "jikka-karute": {
    label: "実家カルテ・相談",
    count: 10,
    position: 9,
    intro: "実家カルテは、実家の状態、家族の希望、書類の所在、これから確認することを一枚ずつ整理するための記録です。",
    conclusion: "売却や処分を決めるためではなく、家族が同じ情報を持つために使います。必要な項目だけから始めてください。",
    points: ["分かる項目だけ記入する", "本人の同意を大切にする", "個人情報の保管場所を決める", "更新日と確認した人を残す"],
    topics: [
      "実家カルテとは何を記録するものか", "実家カルテを家族で作り始める", "実家の基本情報を一枚にまとめる",
      "土地と建物の書類を実家カルテに記録する", "仏壇・お墓の情報を実家カルテに残す", "実家の写真をカルテとして整理する",
      "家族の希望を実家カルテに書き留める", "確認できていない項目を見える化する", "実家カルテを家族会議で更新する",
      "実家カルテをもとに相談を準備する",
    ],
  },
};

function articlePath(category: PortalCategoryKey, index: number) {
  return `/topics/${category}/${category}-${String(index + 1).padStart(2, "0")}/`;
}

const draftArticles = categoryOrder.flatMap((category) => {
  const definition = definitions[category];
  if (definition.topics.length !== definition.count) {
    throw new Error(`${category} must contain ${definition.count} topics`);
  }
  return definition.topics.map((title, index): PortalArticle => ({
    slug: `${category}-${String(index + 1).padStart(2, "0")}`,
    category,
    categoryLabel: definition.label,
    title,
    description: `${title}について、家族で確認する順序と記録しておきたいポイントを整理します。結論を急がず、地域や寺院、本人の希望を大切にするためのガイドです。`,
    lead: definition.intro,
    conclusion: definition.conclusion,
    ...makeSpecificGuidance(title, category, index),
    points: [
      definition.points[index % definition.points.length],
      definition.points[(index + 1) % definition.points.length],
      definition.points[(index + 2) % definition.points.length],
      `「${title.replace(/[？?].*$/, "")}」について、確認日と確認した人を記録する`,
    ],
    faq: [
      {
        question: `「${title.replace(/[？?].*$/, "")}」は一度で決める必要がありますか？`,
        answer: "いいえ。まず確認できた事実を共有し、分からない点を残すだけでも十分です。次に確認する人と時期を決めておくと続けやすくなります。",
      },
      {
        question: "寺院や地域によって違いはありますか？",
        answer: "あります。宗派や地域の習慣を一律に断定せず、菩提寺、墓地管理者、自治体など、その事項を確認できる相手へ個別にお尋ねください。",
      },
    ],
    sources: sourceSets[category],
    cta: category === "jikka-karute" ? "strong" : definition.position >= 6 ? "medium" : "weak",
    updated: "2026-07-27",
    contentType: "guide",
    ...journeyByCategory[category],
  }));
});

export const portalArticles: PortalArticle[] = draftArticles.map((article, globalIndex, all) => {
  const previous = all[globalIndex - 1];
  const next = all[globalIndex + 1];
  const priorityOverride = priorityPortalOverrides[article.slug];
  return {
    ...article,
    contentType: "guide",
    ...journeyByCategory[article.category],
    ...(priorityOverride || {}),
    longform: priorityOverride
      ? buildPriorityLongformV2(article.slug, article.title, article.category, priorityOverride)
      : undefined,
    previous: previous ? { href: articlePath(previous.category, Number(previous.slug.slice(-2)) - 1), label: previous.title } : undefined,
    next: next ? { href: articlePath(next.category, Number(next.slug.slice(-2)) - 1), label: next.title } : undefined,
  };
});

// 量産テンプレ由来の /topics/<category>/<slug>/ 記事は noindex,follow にして検索対象から外す。
// 除外したいslugがあればこの配列から引く（2026-08-30 時点で検索流入のある記事はなく、全件対象）。
const noindexPortalExcludedSlugs: string[] = [];

export const noindexPortalSlugs: string[] = portalArticles
  .map((article) => article.slug)
  .filter((slug) => !noindexPortalExcludedSlugs.includes(slug));

export const portalCategories = categoryOrder.map((key) => ({
  key,
  label: definitions[key].label,
  count: definitions[key].count,
  position: definitions[key].position,
  description: definitions[key].intro,
}));

export function getPortalArticle(category: string, slug: string) {
  return portalArticles.find((article) => article.category === category && article.slug === slug);
}

export function getPortalCategory(category: string) {
  return portalCategories.find((item) => item.key === category);
}

export function getPortalArticlesByCategory(category: string) {
  return portalArticles.filter((article) => article.category === category);
}

export function getNextJourneyArticles(article: PortalArticle, limit = 3) {
  const explicitNext = article.next
    ? portalArticles.find((candidate) => `/topics/${candidate.category}/${candidate.slug}/` === article.next?.href)
    : undefined;
  const nextStage = Math.min(article.journeyStage + 1, 6);
  const candidates = [
    explicitNext,
    ...portalArticles.filter((candidate) => candidate.journeyStage === nextStage),
    ...portalArticles.filter((candidate) => candidate.journeyType === article.journeyType),
  ]
    .filter((candidate): candidate is PortalArticle => candidate !== undefined)
    .filter((candidate) => candidate.slug !== article.slug);

  return candidates.filter((candidate, index) => candidates.findIndex((item) => item.slug === candidate.slug) === index).slice(0, limit);
}
