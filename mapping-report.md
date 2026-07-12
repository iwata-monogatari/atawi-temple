# related-monogatari.json マッピングレポート

- 生成日: 2026-07-12
- 対象: ATAWI TEMPLE 寺院データ（`data/temples.json`、118件）× 磐田物語 記事インデックス（`data/pages.json` 取得時点515件、`updated_at: 2026-07-11`）
- 判定方法: `data/temples.json` の寺院名・別称と、磐田物語の記事タイトルの完全一致（部分文字列一致）を機械抽出し、重複寺院名は `district_id` の一致を必須条件として自動採用。「山号のみ」等の紛らわしい別称一致は目視で個別確認した。

## 採用（A・direct）

寺院名／別称が記事タイトルに直接含まれ、記事内容も当該寺院そのものを扱っている組。

| 寺院 slug | 記事 URL | 記事タイトル |
|---|---|---|
| kokubunji-mitsuke | n034.html | 国分寺ものがたり ── 天平の寺はどう生き続けたか（特集・全12ページ公開）※親ページ |
| kokubunji-mitsuke | n016.html | 遠江国分寺跡と、古代磐田のはじまり |
| kokubunji-mitsuke | n001.html | 遠江国分寺とは何か ── 古代遠江の中心寺院 |
| kokubunji-mitsuke | n044.html | 森本善苗尼と近藤文六 ── 昭和の国分寺復興 |
| kokubunji-mitsuke | n045.html | 令和の薬師堂移築 ── 国分寺奉賛会と2度目の史跡公園 |
| ioji-kamada | u028.html | 医王寺庭園及び参道 ── 鎌田の名勝庭園と参道空間を歩く |
| zendoji-mitsuke | n026.html | 善導寺大クス ── 寺の境内に立つ老樹を、中泉のまちが重ねてきた時間の目印として読む |
| shokoji-mitsuke | m113.html | 旧見付学校以前の寺子屋教育 ── 宣光寺・省光寺と見付の手習い |
| senkoji-mitsuke | m113.html | 旧見付学校以前の寺子屋教育 ── 宣光寺・省光寺と見付の手習い |
| saikoji-mitsuke | m027.html | 見付本陣（神谷家・鈴木家）墓所 ── 西光寺に眠る本陣の家から、宿場の運営を読む |
| saikoji-mitsuke | m028.html | 西光寺大クス附ナギの木 ── 見付宿西端の寺に育つ社寺林の巨木 |
| saikoji-mitsuke | m029.html | 西光寺のイヌマキ ── 時宗の寺に立つイヌマキと見付の社寺林 |
| daijoin-nakaizumi | c082.html | 中泉に息づく二つの信仰拠点 ── 中泉寺と大乗院三仭坊 |
| gyokoji-ikeda | t033.html | 熊野御前ものがたり ── 池田に生きた伝説の女性と行興寺 |
| gyokoji-ikeda | t036.html | 熊野道場由来記と熊野寺旧跡之畧縁起 ── 行興寺草創の二つの物語 |
| gyokoji-ikeda | t037.html | 行興寺の近世史 ── 徳川家康の伝承と朱印地の古文書 |
| gyokoji-ikeda | t002.html | 行興寺と熊野（ゆや）の長藤 |
| shokoji-miyanoshiki | t065.html | 神宮山松向寺 ── 浅間山噴火の記録を伝える豊田町最古最大の木造建築 |

補足: kokubunji-mitsuke は記事タイトルに「国分寺」を含む記事が21件見つかったが、上限5件のため特集親ページ（n034）を軸に、起源（n016・n001）・近代復興（n044）・現況（n045）の5件に絞った。他16件（n002〜n015・n036・n037・n040・n043、matsuri-kokubunji.html、iwata-minami-high-school-history.html等）は上限超過につき今回は不採用。将来 related-monogatari.json を拡充する際の候補として残す。

## 採用（B・topic）

寺院名は記事タイトルに現れないが、寺院の由緒・伝承・祭礼を扱う記事。

| 寺院 slug | 記事 URL | 記事タイトル | 由緒キーワード |
|---|---|---|---|
| daijoin-nakaizumi | n052.html | 資料で読む中泉御殿の史実 - 家康の鷹狩り・秋鹿家・大池 | 中泉御殿（大乗院は御殿の鬼門除け別当を担ったと伝わる） |
| daijoin-nakaizumi | n048.html | 中泉御殿と関ヶ原の戦い ── 家康滞在記録をたどる | 中泉御殿 |
| daijoin-nakaizumi | n021.html | 中泉御殿のあった町 ── 天領を治めた中泉 | 中泉御殿 |
| daijoin-nakaizumi | c061.html | 中泉駅北の歴史地層 ── 御林・赤煉瓦・中泉御殿のそばを通った軌道 | 中泉御殿 |
| kenshoji-mitsuke | c084.html | 磐田の低湿地に残った木の道具 ── 見性寺遺跡の丸木舟と、野際遺跡の木製農具 | 寺名を冠する遺跡（見性寺遺跡） |
| gyokoji-ikeda | t029.html | 池田やかた祭り ── 熊野御前伝承と池田荘の記憶を、祭りのかたちから読み直す | 熊野御前伝承 |

補足: daijoin-nakaizumi は direct 1件＋topic 4件で上限5件に到達。「中泉御殿」関連は他に m060.html・m061.html（城之崎城との混同を解く記事）もあるが、大乗院自体への言及がないため今回は見送った。

## 採用（area）

寺院名を冠する地名・史跡だが、記事内容は考古学的な周辺史であり寺院そのものの記事ではないため area 扱い。

| 寺院 slug | 記事 URL | 記事タイトル | 備考 |
|---|---|---|---|
| shinpoin-mukasa | y011.html | 新豊院山古墳群と台地上の支配者 ── 弥生から古墳へ、向笠の丘に眠る記憶 | 所在地の丘陵名が寺号由来。district_id（koyo）も一致 |
| shinpoin-mukasa | k002.html | 新豊院山古墳群 ── 台地東縁に築かれた前期古墳群【国指定史跡】 | 同上 |

## 不採用（C）── 山号・同名地名による誤マッチ

自動候補生成では文字列一致したが、内容・地区が食い違うため不採用とした組。

| 寺院 slug | 記事 URL | 一致した文字列 | 不採用理由 |
|---|---|---|---|
| kokuseiji-kaketsuka（國清寺・竜洋地区） | u027.html | 「松林山」（國清寺の山号） | 記事は御厨地区の別の史跡「松林山古墳」（松林山古墳群）の記事で、國清寺（竜洋地区）とは無関係。district_id が一致しない（mikuriya ≠ ryuyo） |
| yushoji-toyooka（雄照寺・竜洋地区） | t065.html | 「神宮山」（雄照寺の山号） | 記事本文は同じ山号を持つ別寺院「松向寺」（豊田地区）の記事。district_id が一致しない（toyoda ≠ ryuyo） |

## 検証で判明した除外（detail_page: false）

- **chusenji-nakaizumi（中泉寺）**: 記事 c082.html「中泉に息づく二つの信仰拠点」に大乗院と並んで直接言及があり、当初は direct 採用としていたが、`data/temples.json` 上で `detail_page: false`（個別詳細ページを持たない寺院）のため、`verify_monogatari_links.py` のビルド後HTML確認（項目6）で「ブロックを表示すべきページ自体が生成されない」ことが判明し、related-monogatari.json から除外した。中泉寺の詳細ページが将来追加された場合は再登録candidate。

## 判定不能（該当記事なし）

- 一遍上人・府八幡宮など、事前に想定した由緒キーワードで磐田物語側に該当記事があるか検索したが、上記以外に寺院と直接結びつく記事は見つからなかった。
- 118寺院中、上記12寺院（重複を除く実数）以外は、現時点の磐田物語記事タイトル・由緒キーワードでは確度A/Bの一致が見つからず、related-monogatari.json には未掲載（0件＝寺院ページのブロック非表示）とした。今後、磐田物語側の記事が増えるたびに本レポートの「不採用」候補も含め再突合することを推奨する。

## 9地区ハブURL

`districts` は district_id が両サイトで完全一致するため変換不要。磐田物語は `.html` 付きURLへのアクセスをクリーンURL（`.html` なし）へ308リダイレクトする仕様（例: `/t002.html` → 308 → `/t002`）のため、related-monogatari.json・記事リンクとも「HTTP 200を返すクリーンURL」を採用した（`<link rel="canonical">` は現状 `.html` 付きを指しているが、リンク先としては配信上200を返すクリーンURLの方が適切）。9地区ポータルURLもすべてクリーンURL形式で登録済み。
