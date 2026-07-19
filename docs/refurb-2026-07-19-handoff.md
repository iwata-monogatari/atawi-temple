# ATAWI TEMPLE 全面改修 引き継ぎ書（2026-07-19 22:15時点）

次セッション（Claude Code）への引き継ぎ。指示書 v1.1（`docs/refurb-2026-07-19-shijisho-v1.1.md`）に基づく
寺院個別ページ全面改修の途中経過と、残作業の完遂手順。

## 1. 現在の状態（サマリ）

- **第1陣60件を本番公開済み**（コミット `fb30e4ae` を main へ push。Cloudflare Pages 自動デプロイ）
- 改修対象は全111ページ（118件中7件は `detail_page:false` でページ自体が無い）
- **残り51件**が未公開（うち7件は字数未達でfacts除外、44件は執筆エージェントが作業中だった）
- 等級割当: T1=32 / T2=62 / T3=17（`data/refurb-assignment.json` が正本）

## 2. 場所とブランチ

| 場所 | 用途 |
|---|---|
| `Documents\GitHub\atawi-temple` | 本体クローン。**並列写真セッションの未コミット変更あり（temple-media.json・hero_fix.json等）— 触るな** |
| `Documents\GitHub\atawi-temple-refurb` | 改修作業worktree（ブランチ `refurb-20260719`）。執筆エージェントの書き込み先 |
| `Documents\GitHub\atawi-temple-publish` | 公開用worktree（ブランチ `publish-20260719`）。第1陣はここから main へ push 済み |

- node_modules は両worktreeとも本体への junction（`cmd /c mklink /J node_modules ..\atawi-temple\node_modules`）
- `refurb-20260719` ブランチには全facts（未達含む）のWIPスナップショットがコミット済み

## 3. 仕組み（実装済み・本番稼働中）

- facts方式: `data/temples/<slug>.json` があるページだけ新構成01〜09で描画（無ければ旧表示）。
  読み込みは `src/lib/refurb.ts`、本文は `src/components/RefurbMain.astro`、分岐は `src/pages/temples/[slug].astro`
- 共通モジュール: `data/modules/sect-modules.json`（宗派16）/ `deity-modules.json`（本尊9）
- 執筆仕様の正本: `docs/refurb-2026-07-19-spec.md`（スキーマ・字数定義・禁止語・文体）
- 検証: `node scripts/verify-refurb.mjs [--no-http] [--slug <slug>]`（公開ゲート）
  / `node scripts/count-facts-chars.mjs <slug>`（1件確認）
- 補助: `scripts/fix-source-urls.mjs`（死亡URL→Waybackアーカイブ差し替え。**publish側が最新版**・county名簿/文化財だより226/正眼院の3種を登録済み）
  / `scripts/gen-refurb-updates.mjs`（/updates/一括生成・冪等）
  / `scripts/measure-page-chars.mjs`（改修前字数計測。`data/refurb-baseline.json` 生成済み）
- /status/ に充実度集計カードを実装済み（factsから自動集計）

## 4. 残作業（この順で）

### 4-1. 執筆完了の回収
執筆エージェント15バッチ中、報告済みは5バッチ（パイロット・4・6・9・15）。
セッション終了によりエージェントは停止している可能性が高い。まず現状把握:

```
cd Documents\GitHub\atawi-temple-refurb
node scripts/verify-refurb.mjs --no-http   # 未作成リストとエラーが出る
```

- 未作成・未達のslugは `docs/refurb-2026-07-19-spec.md` を正本に執筆エージェントを再投入する
  （バッチ定義は `.refurb-batches.json`、地区別の注意事項は本引き継ぎ書§6）
- エージェントへの指示要点: temples.json土台＋Web裏取り／新規URLは取得確認／
  県名簿はWaybackアーカイブURL使用／git操作禁止／count-facts-charsで自己検証
- **字数未達7件**（fukuoji-morimoto, gyosenji-mitsuke, jissaiji-samejima, kongoji-mitsuke,
  rinpoin-nishikaizuka, shokyuin-mitsue, shuzoji-toyooka）は refurb ブランチにWIPがあるので
  「不足分の加筆」だけ依頼すればよい（各40〜300字＋community不足2件）

### 4-2. 検品→コミット（バッチごと）
合格確認後、`git add data/temples/<slug>.json`（個別指定・`-A`禁止）→ commit。

### 4-3. 公開（全件揃ったら）
```
cd Documents\GitHub\atawi-temple-publish
git fetch origin && git merge --ff-only origin/main   # 他セッションの写真コミット等を取り込む
git merge refurb-20260719                              # 新しいfactsを取り込む
node scripts/fix-source-urls.mjs
node scripts/gen-refurb-updates.mjs
npm run check                                          # validate→astro check→build→validate:build
node scripts/verify-refurb.mjs                         # HTTP込みフルゲート
python scripts/verify_monogatari_links.py --skip-build --skip-http
git add（変更ファイルをpath指定）→ commit → git push origin publish-20260719:main
```
- push後、本番確認は **キャッシュバスト必須**: `curl -sL "https://temple.atawi.link/temples/<slug>/?cb=$(date +%s)"`
- 過去ページの消失がないことを確認（第1陣公開時は111ページ全生成を validate:build で確認済み）

### 4-4. 完了時
- /status/ の等級集計が T1=32/T2=62/T3=17 になることを確認
- メモリ `atawi-temple-site.md` に完了記録を追記
- worktree掃除（`git worktree remove`）は全完了後に

## 5. 既知の問題・裁定事項

1. **御朱印の矛盾**: 指示書06章の「御朱印」は上位文書 `docs/danka-editorial-policy.md`（全面排除）と
   矛盾するため、**檀家方針を優先し非掲載**で実装済み（ユーザーへ報告済み・異議なし）。
   verify の禁止語 `御朱印(?![状高地])` で機械enforce
2. **静岡県サイト改編（2026年5〜7月）**: 宗教法人名簿ページ・PDFが404化。
   Wayback 2026-05-12版へ全面差し替え済み（fix-source-urls.mjsが自動処理）。
   **県の新URL判明時に差し戻すのがresearch_todo**
3. **sotozen-navi.com が2026-07-19時点でサイトごとダウン**: 既存出典の引き継ぎのみ許容
   （verifyで警告扱い）。復旧確認もresearch_todo
4. **多聞寺（tamonji-nakano）の地区分類疑義**: 「磐田市中野」は旧福田町域ではなく
   旧豊田郡中野村→天竜村→磐田町の系譜（コトバンク・geoshapeで確認済み）。
   `district_id: fukude` は誤りの可能性が高い（nanbu?）。**temples.json の修正は
   磐田市公式「旧○○町の住所表示」で裏取りしてから**（docs/district-policy.md 参照）
5. **警告扱いホスト**（verify-refurb.mjs の HTTP_WARN_ONLY_HOSTS）:
   enshu33(SSL) / facebook(bot) / sotozen-navi(down) / linkdata(500) / omairi.club(403) / kojodan.jp(UA判定)
6. **本体クローンの未コミット変更**は並列写真セッションの作業中データ。絶対に触らない・コミットしない

## 6. 未完了バッチの担当と個別注意（再投入時に使う）

| バッチ | 地区 | 未回収slug例 | 個別注意 |
|---|---|---|---|
| 1 | 見付 | fukuoji-jonosaki, daikenji-mitsuke, tokuoin-mitsuke ほか | T1多数。西光寺・福王寺は市内同名あり |
| 2 | 見付 | kokubunji-mitsuke ほか | 国分寺は顔ページ。寺と国指定特別史跡（国分寺跡）を区別 |
| 3 | 豊田 | gyokoji-ikeda ほか | 行興寺=熊野御前・長藤。観光文体禁止 |
| 5 | 豊岡 | seiryo-in-iwamuro, jigenji-kamikandamasu ほか | unknown多数→worship無し・ruin_note必須 |
| 7 | 向陽 | anzenji-iwai ほか（多くは回収済みWIPあり） | 情報乏しい寺は正直申告ルール |
| 8 | 福田 | zohonji-ikago, chosenji-fukudenakajima, ryuunji-toyohama ほか | 壽正寺同名注意 |
| 10 | 中泉 | honshoji-kounodai, gasshoji-nakaizumi ほか | 大乗院=中泉御殿・代官所文脈 |
| 11 | 御厨 | zenkaiji-nishijima ほか一部回収済み | T1の全海寺・林宝院は情報薄→正直申告 |
| 12/13 | 竜洋 | koshuji-kaketsuka, chikyoin-shiraha ほか | **満福寺(819)と萬福寺(799)を絶対に混同しない** |
| 14 | 南部 | jokoji-maeno, jurinji-kamiohnogo ほか | 壽正寺（草崎）は福田の寿正寺と別 |

（正確な残リストは verify-refurb.mjs --no-http の「facts未作成」出力が正本）

## 7. 第1陣公開の内訳（60件）

T1=24・T2=29・T3=7（等級はfacts内 `grade`）。公開ページはバッジ「充実/標準/基礎情報」、
本文01〜09、FAQ構造化データ、/updates/ 60エントリ、/status/ 集計カードが本番反映される。
