# 公開リンクの点検と修正（2026-11-12）

公開HTML 886ページから内部1,055 URL・外部1,664 URLを抽出して本番を照合した。内部では4種類・8か所の404を確認し、ブログ本文・関連記事・研究出典を現行ページへ修正した。旧URLも `functions/_middleware.js` の301で救済する。先行の問い合わせ4 URLの転送を保持する。

外部のHEADで404だった91 URLはGETで再確認した。2件はGETで200、3件は403または接続待ちとなったのでページなしと断定せず保留した。GETでも404の86 URLのうち、同じ資料・案内の現行URLを確認できた7件はリンク先を修正。残り79件は資料名・原URL・元の参照記録を保持し、公開HTMLでは非リンクの資料名と日付付き注記へ変換する。公式のバックナンバー・冊子一覧などを確認できた場合は、それを探すための別リンクを付ける。一覧ページを元資料そのものの出典に置き換えない。

`data/reference-link-health.json` は、この日に確かめたURLだけの修正表である。`scripts/repair-reference-links.mjs` をAstroのbuild完了時に実行し、ブログHTMLを含む全形式の出典リンクへ同じ処理を適用する。元の研究・寺院・ブログの出典データ、確認日、引用内容は変更しない。未調査URL、403、503、タイムアウト、証明書エラーにはこの処理を適用しない。

県名簿の移動は県公式「宗教法人名簿」ページから、観光地図の同名PDFの移動は観光協会「観光パンフレット＆ウォーキングマップ」から確認した。

- 県名簿: https://www.pref.shizuoka.jp/kensei/gyoseikaikaku/1083643/1083669/1083677.html
- 観光地図: https://kanko-iwata.jp/useful_information/pamphlet/
- 文化財だよりのバックナンバー: https://www.city.iwata.shizuoka.jp/sports_midokoro/bunkazai/bunkazainitsuite/1007901.html

完全な取得結果・原文・確認範囲・公開SHAと本番証拠は `C:/Users/Owner/Documents/work_codex/outputs/temple-link-audit-20261112/verification.json` を正本とする。旧キャッシュだけで同じ修正を再施工しない。将来、新しい証拠で参照先の復旧や同一資料の移動を確認した場合は該当行だけを見直す。新しい監視・自動取得は追加しない。

`npm run validate:build` は生成済みHTMLの内部リンク先と既知転送を検査する。外部サイトへビルドごとのネットワーク検査はしない。
