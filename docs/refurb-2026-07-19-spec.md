# ATAWI TEMPLE 全面改修 執筆仕様書（2026-07-19・当日完遂版）

寺院個別ページ全111件（detail_page:false の7件を除く）を facts ファイル方式で全面改稿する。
本書が執筆エージェント全員の正本。指示書 v1.1 と docs/danka-editorial-policy.md / docs/source-policy.md に従う。

## ファイル方式

- 1寺院 = 1ファイル `data/temples/<slug>.json`（新設ディレクトリ。既存 `data/temples.json` は変更しない）
- facts ファイルが存在する寺院はテンプレートが新構成（01〜09）で描画する。存在しなければ旧構成のまま
- 等級・字数下限は `data/refurb-assignment.json` の該当行に従う（grade / target）

## facts JSON スキーマ

```json
{
  "slug": "ioji-kamada",
  "grade": "T1",
  "last_verified_at": "2026-07-19",
  "lead": "120〜160字のリード文。ページ冒頭。",
  "about": ["段落1", "段落2"],
  "history_sections": [
    { "heading": "創建と草創期", "body": "..." }
  ],
  "cultural_assets": [
    { "designation": "磐田市指定文化財（名勝）", "name": "医王寺庭園及び参道", "summary": "150〜300字の個別解説" }
  ],
  "sect_deity": {
    "sect_module_id": "shingon-chisan",
    "deity_module_id": "yakushi",
    "intro": "100字以上。当寺の札所・行事・伝承と宗派/本尊を結び付けた個別化文。共通モジュール本文より先に表示される。"
  },
  "community": {
    "body": ["段落1", "段落2"],
    "ruin_note": "（廃寺・寺院跡のみ）跡地の現況"
  },
  "worship_guide": {
    "annual_events": [ { "name": "施餓鬼会", "timing": "8月", "note": "" } ],
    "visit_notes": ["法要・お墓参りで訪れる際の注意点など"],
    "pending": ["未確認項目（調査中表示になる）"]
  },
  "faq": [
    { "q": "醫王寺の読み方は？", "a": "「いおうじ」と読みます。…", "anchor": "about" }
  ],
  "sources": [
    { "title": "…", "type": "行政・公的資料", "url": "https://…", "note": "何を確認したかを1〜2文で必ず書く" }
  ],
  "research_todos": ["未解決の論点"]
}
```

- `about` は合計400〜600字
- `history_sections` は3〜5本（創建／中世・近世／近代・現代 など時代区分）
- `cultural_assets` は指定文化財を1件ずつ個別解説（各150〜300字）。指定なしの寺院は境内の見どころ（本堂・石造物・古木等）でよい
- `sect_deity.intro` は100字以上必須。モジュールIDは `data/modules/sect-modules.json` / `data/modules/deity-modules.json` の id を指定
- `community.body` は合計400字以上。地区の歴史文脈（東海道見付宿・遠江国府・掛塚湊・天竜川治水・旧町村など）と当寺の立地を関連付ける
- 廃寺・寺院跡（status が existing 以外）は `worship_guide` を出力せず、`community.ruin_note` に跡地の現況を書く
- `faq` は T1=6〜8問、T2=5〜8問、T3=任意(0〜5問)。回答は本文の要約のみ（新事実を書かない）。anchor は about/history/heritage/sect-deity/community/worship のいずれか
- `sources` は T1=12件以上、T2=8件以上、T3=5件以上。既存 `data/temples.json` の当該寺院 `sources` を引き継いだうえで追加してよい。note（何を確認したか）必須
- `worship_guide.annual_events` は既存 `danka_info.annual_events` を引き継ぐ

## 字数基準（機械検証される）

- 本文字数 = lead + about + history_sections(heading+body) + cultural_assets(name+summary) + sect_deity.intro + 参照モジュール本文 + community + worship_guide(visit_notes等) + faq(q+a) の空白除き文字数
- `data/refurb-assignment.json` の `target`（= max(改修前×2, 等級下限)）以上にする。T1=6,000／T2=4,500／T3=2,500 が下限
- **水増し禁止**。出典のない引き伸ばし・同語反復・一般論の羅列は不可。字数はリサーチ事実・モジュール個別化・FAQ要約で稼ぐ。どうしても満たせない場合は無理に埋めず、その旨を返信で報告する（等級を下げる判断は統括側で行う）

## 事実の採用基準（A/B/C）

| 区分 | 基準 | 扱い |
|---|---|---|
| A 確定 | 行政資料・指定台帳・宗教法人名簿・寺院公式で確認 | 断定して記載＋出典対応 |
| B 伝承・二次 | 寺伝、市誌の伝承記述、信頼できる二次情報 | 「〜と伝わる」「〜とされる」＋出典明示 |
| C 未確認 | 出典が取れない・矛盾 | 本文に書かず research_todos へ |

- **出典のない断定文を1文でも含むページは公開不可**
- 既存 `data/temples.json` の当該エントリ（history_summary / historical_sections / cultural_assets / danka_info / sources / pilgrimage_note 等）は2026年7月の一括調査済みデータであり土台として全面活用してよい（既存出典をそのまま引き継ぐ）
- 新規追加の事実は必ず Web で裏取りし、URLを出典に加える。リンク切れURLは採用しない
- 学説・伝承が対立する場合は断定せず併記
- 同名寺院の混同に最注意（市内にも西光寺×2・福王寺×2・壽正寺×2。全国の同名寺サイトが検索上位に来る）
- Wikipedia・参拝ポータルは「発見専用」。公開事実の単独根拠にしない

## 禁止事項（1件でも違反したら公開ゲートで落ちる）

- 不動産語彙: 売却・査定・空き家・実家じまい・不動産・住み替え・資産価値・仲介・買取・リフォーム
- 「御朱印」の語（現代のスタンプ収集文化）。**江戸期の「朱印状」「朱印地」「朱印高」は歴史事実として記載可**
- 拝観時間・拝観料・有人無人・観光モデルコース・「映えスポット」的紹介（檀家向けサイトのため）
- 執筆プロセスの自己言及（「今回の調査では〜」等）。未確認は「現時点では確認できていません」と書く
- CTA・導線文の手書き（テンプレートが管理する）

## 文体・表記

- ですます調（である調は使用しない）
- 数字は算用数字、元号(西暦)併記。例: 元亀3年(1572年)
- 寺院名の正式表記はページ内で統一（醫王寺/医王寺 等の揺れは別称欄で吸収）
- 視点は常に「檀家・地域の記憶の伝承」。観光案内の文体にしない

## 等級別の必須セクション

| 等級 | 必須 |
|---|---|
| T1 | lead / about / history 3本以上 / cultural_assets / sect_deity / community / worship_guide / faq 6問以上 / sources 12件以上 |
| T2 | lead / about / history 3本以上 / sect_deity / community / faq 5問以上 / sources 8件以上（cultural_assets・worship_guide は可能な範囲） |
| T3 | lead / about / history / sect_deity / community（跡地現況含む） / sources 5件以上 |
